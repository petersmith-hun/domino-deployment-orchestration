import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import JWTUtility from "../../../../src/domino/web/util/JWTUtility";
import AuthenticationController from "../../../../src/domino/web/controller/AuthenticationController";
import {ResponseStubTemplate} from "../../testutils/TestUtils";

const REQUEST_BODY = {"username": "user1"};
const GENERATED_TOKEN = "generated-token";

describe("Unit tests for AuthenticationController", () => {

	let requestMock = null;
	let responseMock = null;
	let jwtUtilityMock = null;
	let authenticationController = null;

	beforeEach(() => {
		requestMock = sinon.stub();
		responseMock = sinon.createStubInstance(ResponseStubTemplate);
		jwtUtilityMock = sinon.createStubInstance(JWTUtility);

		authenticationController = new AuthenticationController(jwtUtilityMock);
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
