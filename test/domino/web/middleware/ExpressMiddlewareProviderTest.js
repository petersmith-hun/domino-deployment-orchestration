import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import JWTUtility from "../../../../src/domino/web/util/JWTUtility";
import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import ExpressMiddlewareProvider from "../../../../src/domino/web/middleware/ExpressMiddlewareProvider";
import {ResponseStubTemplate} from "../../testutils/TestUtils";
import AuthenticationError from "../../../../src/domino/web/error/AuthenticationError";
import NonAcceptableMimeTypeError from "../../../../src/domino/web/error/NonAcceptableMimeTypeError";
import NonRegisteredAppError from "../../../../src/domino/web/error/NonRegisteredAppError";
import AlreadyExistingExecutableError from "../../../../src/domino/web/error/AlreadyExistingExecutableError";
import InvalidRequestError from "../../../../src/domino/web/error/InvalidRequestError";
import NonExistingExecutableError from "../../../../src/domino/core/error/NonExistingExecutableError";
import {UnauthorizedError} from "express-oauth2-jwt-bearer";
import {AuthorizationMode} from "../../../../src/domino/core/domain/AuthorizationMode";

describe("Unit tests for ExpressMiddlewareProvider", () => {

	let jwtUtilityMock = null;
	let configurationProviderMock = null;
	let responseMock = null;
	let expressMiddlewareProvider = null;

	beforeEach(() => {
		jwtUtilityMock = sinon.createStubInstance(JWTUtility);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		responseMock = sinon.createStubInstance(ResponseStubTemplate);

		configurationProviderMock.getSecurityConfig.returns({
			"allowed-sources": ["127.0.0.1", "192.168.0.1"],
			"oauth-issuer": "http://localhost:9999",
			"oauth-audience": "aud:domino"
		});
		configurationProviderMock.getAuthorizationMode.returns(AuthorizationMode.DIRECT);

		expressMiddlewareProvider = new ExpressMiddlewareProvider(jwtUtilityMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #jwtVerification", () => {

		it("should allow access for public endpoints", () => {

			// given
			const requestParams = {
				path: "/claim-token"
			};
			let nextCalled = false;

			// when
			expressMiddlewareProvider.jwtVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
			sinon.assert.notCalled(jwtUtilityMock.verifyToken);
		});

		it("should fall through when OAuth authorization is active", () => {

			// given
			const requestParams = {
				path: "/protected/endpoint"
			};
			let nextCalled = false;

			configurationProviderMock.getAuthorizationMode.returns(AuthorizationMode.OAUTH);
			expressMiddlewareProvider = new ExpressMiddlewareProvider(jwtUtilityMock, configurationProviderMock);

			// when
			expressMiddlewareProvider.jwtVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
			sinon.assert.notCalled(jwtUtilityMock.verifyToken);
		});

		it("should verify token on non-public endpoints", () => {

			// given
			const requestParams = {
				path: "/protected/endpoint",
				headers: {
					authorization: "Bearer token"
				}
			};
			let nextCalled = false;

			// when
			expressMiddlewareProvider.jwtVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
			sinon.assert.calledWith(jwtUtilityMock.verifyToken, requestParams.headers.authorization);
		});

		it('should verify token on non-public endpoints and return 403 on verification failure', function () {

			// given
			const requestParams = {
				path: "/protected/endpoint",
				headers: {
					authorization: "Bearer token"
				}
			};
			jwtUtilityMock.verifyToken.throws(new Error("Authentication failed"));
			responseMock.status.withArgs(403).returns(responseMock);
			let nextCalled = false;

			// when
			expressMiddlewareProvider.jwtVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isFalse(nextCalled);
			sinon.assert.calledWith(responseMock.status, 403);
			sinon.assert.called(responseMock.send);
		});
	});

	describe("Test scenarios for #oauthJWTVerification", () => {

		it("should fall through when direct authorization is active", () => {

			// given
			let nextCalled = false;

			// when
			expressMiddlewareProvider.oauthJWTVerification()({}, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
		});

		it("should try authorization of request when OAuth mode is active", () => {

			// given
			configurationProviderMock.getAuthorizationMode.returns(AuthorizationMode.OAUTH);
			expressMiddlewareProvider = new ExpressMiddlewareProvider(jwtUtilityMock, configurationProviderMock);

			// when
			const result = expressMiddlewareProvider.oauthJWTVerification();

			// then
			assert.isTrue(result instanceof Function);
		});
	});

	describe("Test scenarios for #remoteAddressVerification", () => {

		it("should allow forwarded address", () => {

			// given
			const requestParams = {
				headers: {
					"x-forwarded-for": "127.0.0.1"
				}
			};
			let nextCalled = false;

			// when
			expressMiddlewareProvider.remoteAddressVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
		});

		it("should allow direct remote address", () => {

			// given
			const requestParams = {
				headers: {},
				connection: {
					remoteAddress: "127.0.0.1"
				}
			};
			let nextCalled = false;

			// when
			expressMiddlewareProvider.remoteAddressVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
		});

		it("should reject not allowed address", () => {

			// given
			const requestParams = {
				headers: {},
				connection: {
					remoteAddress: "10.0.0.1"
				}
			};
			let nextCalled = false;

			try {

				// when
				expressMiddlewareProvider.remoteAddressVerification(requestParams, responseMock, () => {
					nextCalled = true;
				});

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				if (!(e instanceof AuthenticationError)) {
					assert.fail("Test case should have thrown AuthenticationError");
				}

				// exception expected
			}

			// then
			assert.isFalse(nextCalled);
		});

		it("should verification be disabled by specifying non-array configuration value", () => {

			// given
			const requestParams = {
				headers: {},
				connection: {
					remoteAddress: "10.0.0.1"
				}
			};
			let nextCalled = false;
			configurationProviderMock.getSecurityConfig.returns({
				"allowed-source": "ALL"
			});
			expressMiddlewareProvider = new ExpressMiddlewareProvider(jwtUtilityMock, configurationProviderMock);

			// when
			expressMiddlewareProvider.remoteAddressVerification(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
		});
	});

	describe("Test scenarios for #callStartMarker", () => {

		it("should add call start marker to the request", () => {

			// given
			const requestParams = {};
			let nextCalled = false;

			// when
			expressMiddlewareProvider.callStartMarker(requestParams, responseMock, () => {
				nextCalled = true;
			});

			// then
			assert.isTrue(nextCalled);
			assert.isNotNull(requestParams.callStartTime);
		});
	});

	describe("Test scenarios for #defaultErrorHandler", () => {

		const defaultErrorHandlingScenarios = [
			{error: new NonAcceptableMimeTypeError(), expectedStatus: 406},
			{error: new NonRegisteredAppError(), expectedStatus: 406},
			{error: new AlreadyExistingExecutableError(), expectedStatus: 409},
			{error: new InvalidRequestError(), expectedStatus: 400},
			{error: new NonExistingExecutableError(), expectedStatus: 404},
			{error: new AuthenticationError(), expectedStatus: 403},
			{error: new UnauthorizedError(), expectedStatus: 403},
			{error: new Error(), expectedStatus: 500},
		];

		defaultErrorHandlingScenarios.forEach(scenario => {

			it(`should map exception to the corresponding HTTP status [${scenario.error} => ${scenario.expectedStatus}]`, () => {

				// given
				responseMock.status.withArgs(scenario.expectedStatus).returns(responseMock);
				let nextCalled = false;

				// when
				expressMiddlewareProvider.defaultErrorHandler(scenario.error, {}, responseMock, () => {
					nextCalled = true;
				});

				// then
				assert.isFalse(nextCalled);
				sinon.assert.calledWith(responseMock.status, scenario.expectedStatus);
				sinon.assert.called(responseMock.send);
			});
		});
	});
});
