import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import JWTUtility from "../../../../src/domino/web/util/JWTUtility";
import ms from "ms";
import AuthenticationError from "../../../../src/domino/web/error/AuthenticationError";
import {wait} from "../../testutils/TestUtils";

const _TEST_SECURITY_CONFIG = {
	username: "test-admin",
	password: "$2b$12$b0eO/NiQWfM6MaD6980M5udzb6QMYXCH6OV5F4CxEv3hod45ROqHq",
	"jwt-private-key": "dcba4321",
	expiration: "1 min"
};

describe("Unit tests for JWTUtility", () => {

	let configurationProviderMock = null;
	let jwtUtility = null;

	beforeEach(() => {
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		configurationProviderMock.getSecurityConfig.returns(_TEST_SECURITY_CONFIG);

		jwtUtility = new JWTUtility(configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #createToken", () => {

		const incorrectCredentialScenarios = [
			_prepareAuthRequest("invalid-user"),
			_prepareAuthRequest(_TEST_SECURITY_CONFIG.username, "invalid-password")
		];

		it("should successfully authenticate and return token", () => {

			// given
			const validAuthRequest = _prepareAuthRequest();

			// when
			const result = jwtUtility.createToken(validAuthRequest);

			// then
			const decodedTokenParts = result.split("\.");
			const header = _parseTokenPart(decodedTokenParts[0]);
			const payload = _parseTokenPart(decodedTokenParts[1]);

			assert.equal(header.alg, "HS256");
			assert.equal(header.typ, "JWT");
			assert.equal(payload.service, _TEST_SECURITY_CONFIG.username);
			assert.equal(payload.exp - payload.iat, ms(_TEST_SECURITY_CONFIG.expiration) / 1000);
			assert.equal(payload.iss, "domino");
		});

		incorrectCredentialScenarios.forEach(incorrectCredentials => {
			it(`should fail to authenticate because of incorrect credentials [${incorrectCredentials}]`, () => {

				// when
				_expectAuthenticationError(() => jwtUtility.createToken(incorrectCredentials));
			});
		});

		function _parseTokenPart(tokenPart) {
			return JSON.parse(Buffer.from(tokenPart, "base64").toString())
		}
	});

	describe("Test scenarios for #verifyToken", () => {

		const invalidAuthHeaderScenarios = [
			"Bearer not-a-jwt-token",
			"no-bearer-keyword",
			"Basic incorrect:auth-type"
		];

		it("should successfully verify token", () => {

			// given
			const authHeaderValue = `Bearer ${jwtUtility.createToken(_prepareAuthRequest())}`;

			// when
			jwtUtility.verifyToken(authHeaderValue);

			// then
			// silent flow-through expected
		});

		invalidAuthHeaderScenarios.forEach(authHeaderValue => {

			it(`should fail because of invalid authorization header [${authHeaderValue}]`, () => {

				// when
				_expectAuthenticationError(() => jwtUtility.verifyToken(authHeaderValue));
			});
		});

		it("should fail because of expired token", async () => {

			// given
			const updatedSecurityConfig = Object.assign({}, _TEST_SECURITY_CONFIG);
			updatedSecurityConfig.expiration = "150 ms";
			configurationProviderMock.getSecurityConfig.returns(updatedSecurityConfig);
			const updatedJWTUtility = new JWTUtility(configurationProviderMock);
			const token = `Bearer ${updatedJWTUtility.createToken(_prepareAuthRequest())}`;

			// when
			await wait(200); // token expires
			_expectAuthenticationError(() => jwtUtility.verifyToken(token));
		});

		it("should fail because of invalid service user", () => {

			// given
			const updatedSecurityConfig = Object.assign({}, _TEST_SECURITY_CONFIG);
			updatedSecurityConfig.username = "different-user";
			configurationProviderMock.getSecurityConfig.returns(updatedSecurityConfig);
			const updatedJWTUtility = new JWTUtility(configurationProviderMock);
			const token = `Bearer ${updatedJWTUtility.createToken(_prepareAuthRequest(updatedSecurityConfig.username))}`;

			// when
			_expectAuthenticationError(() => jwtUtility.verifyToken(token));
		});
	});

	function _prepareAuthRequest(username, password) {

		return {
			username: username || _TEST_SECURITY_CONFIG.username,
			password: password || "abcd"
		}
	}

	function _expectAuthenticationError(call) {

		try {

			// when
			call();

			assert.fail("Test case should have thrown error");
		} catch (e) {

			// then
			if (!(e instanceof AuthenticationError)) {
				assert.fail("Test case should have thrown AuthenticationError");
			}

			// exception expected
		}
	}
});
