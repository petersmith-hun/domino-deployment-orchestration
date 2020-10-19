import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import {ResponseStubTemplate} from "../../testutils/TestUtils";
import DeploymentService from "../../../../src/domino/core/service/DeploymentService";
import RequestValidator from "../../../../src/domino/web/util/RequestValidator";
import LifecycleController from "../../../../src/domino/web/controller/LifecycleController";
import {DeploymentStatus} from "../../../../src/domino/core/domain/DeploymentStatus";
import {InfoStatus} from "../../../../src/domino/core/domain/InfoStatus";

const _TEST_VERSION = "1.2.3";
const _TEST_APP = "app-1";
const _DEPLOYED_STATUS = DeploymentStatus.DEPLOYED;

describe("Unit tests for LifecycleController", () => {

	let requestMock = null;
	let responseMock = null;
	let deploymentServiceMock = null;
	let requestValidatorMock = null;
	let lifecycleController = null;

	beforeEach(() => {
		requestMock = sinon.stub();
		responseMock = sinon.createStubInstance(ResponseStubTemplate);
		deploymentServiceMock = sinon.createStubInstance(DeploymentService);
		requestValidatorMock = sinon.createStubInstance(RequestValidator);

		lifecycleController = new LifecycleController(deploymentServiceMock, requestValidatorMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #getInfo", () => {

		it("should return application info", async () => {

			// given
			requestMock.params = {
				app: _TEST_APP
			};
			const appInfo = {
				status: InfoStatus.PROVIDED,
				info: {
					version: "1.0.0",
					name: "Test Application"
				}
			};
			deploymentServiceMock.getInfo.withArgs(requestMock.params.app).resolves(appInfo)
			responseMock.status.withArgs(200).returns(responseMock);

			// when
			await lifecycleController.getInfo(requestMock, responseMock);

			// then
			const sendCallArgument = responseMock.send.getCall(0).args[0];
			assert.deepEqual(sendCallArgument, appInfo.info);
		});
	});

	describe("Test scenarios for #deploy", () => {

		it("should successfully deploy with explicit version", async () => {

			// given
			_prepareDeployMocks(true);

			// when
			await lifecycleController.deploy(requestMock, responseMock);

			// then
			_verifyDeploymentResponse(true);
		});

		it("should successfully deploy with latest version", async () => {

			// given
			_prepareDeployMocks(false);

			// when
			await lifecycleController.deploy(requestMock, responseMock);

			// then
			_verifyDeploymentResponse(true);
		});

		it("should fail to deploy due to validation error", async () => {

			// given
			requestMock.params = {};
			responseMock.status.withArgs(400).returns(responseMock);
			requestValidatorMock.isLifecycleRequestValid.withArgs(requestMock.params).returns(false);

			// when
			await lifecycleController.deploy(requestMock, responseMock);

			// then
			_verifyDeploymentResponse(false);
		});

		function _prepareDeployMocks(withVersion) {
			const deploymentResponse = {
				status: _DEPLOYED_STATUS,
				version: _TEST_VERSION
			};
			requestMock.params = {
				app: _TEST_APP
			};

			if (withVersion) {
				requestMock.params.version = _TEST_VERSION;
				deploymentServiceMock.deploy.withArgs(_TEST_APP, _TEST_VERSION).resolves(deploymentResponse);
			} else {
				deploymentServiceMock.deployLatest.withArgs(_TEST_APP).resolves(deploymentResponse);
			}

			requestValidatorMock.isLifecycleRequestValid.withArgs(requestMock.params).returns(true);
			responseMock.status.withArgs(201).returns(responseMock);
		}

		function _verifyDeploymentResponse(valid) {
			const sendCallArgument = responseMock.send.getCall(0).args[0];
			if (valid) {
				assert.include(sendCallArgument.message, `Deployment has finished for version=${_TEST_VERSION} in`);
				assert.equal(sendCallArgument.status, _DEPLOYED_STATUS);
				assert.equal(sendCallArgument.version, _TEST_VERSION);
			} else {
				assert.deepEqual(sendCallArgument, {
					message: "Deployment has failed due to invalid request",
					status: DeploymentStatus.INVALID_REQUEST
				});
				sinon.assert.notCalled(deploymentServiceMock.deploy);
				sinon.assert.notCalled(deploymentServiceMock.deployLatest);
			}
		}
	});

	describe("Test scenarios for #start", () => {

		it("should call start lifecycle command with success", async () => {

			// given
			_prepareLifecycleCommandMock(true, 202);
			deploymentServiceMock.start.withArgs(_TEST_APP).returns(DeploymentStatus.UNKNOWN_STARTED);

			// when
			await lifecycleController.start(requestMock, responseMock);

			// then
			_verifyLifecycleResponse(DeploymentStatus.UNKNOWN_STARTED);
		});

		it("should not call start lifecycle command due to validation failure", async () => {

			// given
			_prepareLifecycleCommandMock(false);

			// when
			await lifecycleController.start(requestMock, responseMock);

			// then
			_verifyLifecycleResponse(DeploymentStatus.INVALID_REQUEST);
			sinon.assert.notCalled(deploymentServiceMock.start);
		});
	});

	describe("Test scenarios for #stop", () => {

		it("should call stop lifecycle command with success", async () => {

			// given
			_prepareLifecycleCommandMock(true, 202);
			deploymentServiceMock.stop.withArgs(_TEST_APP).returns(DeploymentStatus.UNKNOWN_STOPPED);

			// when
			await lifecycleController.stop(requestMock, responseMock);

			// then
			_verifyLifecycleResponse(DeploymentStatus.UNKNOWN_STOPPED);
		});

		it("should not call stop lifecycle command due to validation failure", async () => {

			// given
			_prepareLifecycleCommandMock(false);

			// when
			await lifecycleController.stop(requestMock, responseMock);

			// then
			_verifyLifecycleResponse(DeploymentStatus.INVALID_REQUEST);
			sinon.assert.notCalled(deploymentServiceMock.stop);
		});
	});

	describe("Test scenarios for #restart", () => {

		it("should call restart lifecycle command with success", async () => {

			// given
			_prepareLifecycleCommandMock(true, 201);
			deploymentServiceMock.restart.withArgs(_TEST_APP).returns(DeploymentStatus.HEALTH_CHECK_OK);

			// when
			await lifecycleController.restart(requestMock, responseMock);

			// then
			_verifyLifecycleResponse(DeploymentStatus.HEALTH_CHECK_OK);
		});

		it("should not call restart lifecycle command due to validation failure", async () => {

			// given
			_prepareLifecycleCommandMock(false);

			// when
			await lifecycleController.restart(requestMock, responseMock);

			// then
			_verifyLifecycleResponse(DeploymentStatus.INVALID_REQUEST);
			sinon.assert.notCalled(deploymentServiceMock.restart);
		});
	});

	function _prepareLifecycleCommandMock(valid, expectedStatus = 400) {
		requestMock.params = {
			app: _TEST_APP
		};
		requestValidatorMock.isLifecycleRequestValid.withArgs(requestMock.params).returns(valid);
		responseMock.status.withArgs(expectedStatus).returns(responseMock);
	}

	function _verifyLifecycleResponse(expectedStatus) {

		const sendCallArgument = responseMock.send.getCall(0).args[0];
		assert.equal(sendCallArgument.status, expectedStatus);
		assert.include(sendCallArgument.message, "Processed in");
	}
});
