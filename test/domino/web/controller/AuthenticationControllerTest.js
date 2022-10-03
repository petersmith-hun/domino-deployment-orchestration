import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import JWTUtility from "../../../../src/domino/web/util/JWTUtility";
import AuthenticationController from "../../../../src/domino/web/controller/AuthenticationController";
import {ResponseStubTemplate} from "../../testutils/TestUtils";
import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import {AuthorizationMode} from "../../../../src/domino/core/domain/AuthorizationMode";
import AuthenticationError from "../../../../src/domino/web/error/AuthenticationError";

const REQUEST_BODY = {"username": "user1"};
const GENERATED_TOKEN = "generated-token";

describe("Unit tests for AuthenticationController", () => {

	let requestMock = null;
	let responseMock = null;
	let jwtUtilityMock = null;
	let configurationProviderMock = null;
	let authenticationController = null;

	beforeEach(() => {
		requestMock = sinon.stub();
		responseMock = sinon.createStubInstance(ResponseStubTemplate);
		jwtUtilityMock = sinon.createStubInstance(JWTUtility);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		configurationProviderMock.getAuthorizationMode.returns(AuthorizationMode.DIRECT);

		authenticationController = new AuthenticationController(jwtUtilityMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenario for #claimToken", () => {

		it("should create token with success", () => {

			// given
			requestMock.body = REQUEST_BODY;
			responseMock.status.withArgs(201).returns(responseMock);
			jwtUtilityMock.createToken.withArgs(REQUEST_BODY).returns(GENERATED_TOKEN);

			// when
			authenticationController.claimToken(requestMock, responseMock);

			// then
			sinon.assert.calledWith(responseMock.send, {jwt: GENERATED_TOKEN});
		});

		it("should reject token creation when OAuth mode is active", () => {

			// given
			requestMock.body = REQUEST_BODY;
			configurationProviderMock.getAuthorizationMode.returns(AuthorizationMode.OAUTH);
			authenticationController = new AuthenticationController(jwtUtilityMock, configurationProviderMock);

			// when
			assert.throws(() => authenticationController.claimToken(requestMock, responseMock), AuthenticationError, "Unsupported authentication method");

			// then
			sinon.assert.notCalled(jwtUtilityMock.createToken);
		});
	});

	describe("Test scenario for #getControllerName", () => {

		it("should controller name be 'auth'", () => {

			// when
			const result = authenticationController.getControllerName();

			// then
			assert.equal(result, "auth");
		});
	});
});
