import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import DeploymentService from "../../../../src/domino/core/service/DeploymentService";
import UploadController from "../../../../src/domino/web/controller/UploadController";
import {ResponseStubTemplate} from "../../testutils/TestUtils";
import {DeploymentStatus} from "../../../../src/domino/core/domain/DeploymentStatus";

const _TEST_VERSION = "1.2.3";
const _TEST_APP = "app-1";

describe("Unit tests for UploadController", () => {

	let requestMock = null;
	let responseMock = null;
	let deploymentServiceMock = null;
	let uploadController = null;

	beforeEach(() => {
		requestMock = sinon.stub();
		responseMock = sinon.createStubInstance(ResponseStubTemplate);
		deploymentServiceMock = sinon.createStubInstance(DeploymentService);

		uploadController = new UploadController(deploymentServiceMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #uploadExecutable", () => {

		it("should upload executable return immediately", async () => {

			// given
			_prepareUploadMocks(201);

			// when
			await uploadController.uploadExecutable(requestMock, responseMock);

			// then
			_verifyUploadResponse(DeploymentStatus.UPLOADED);
		});

		it("should upload executable deploy before returning (autodeploy=true)", async () => {

			// given
			_prepareUploadMocks(201);
			requestMock.query.autodeploy = true;
			deploymentServiceMock.deploy.withArgs(_TEST_APP, _TEST_VERSION).returns({status: DeploymentStatus.DEPLOYED});

			// when
			await uploadController.uploadExecutable(requestMock, responseMock);

			// then
			_verifyUploadResponse(DeploymentStatus.DEPLOYED);
			sinon.assert.notCalled(deploymentServiceMock.restart);
		});

		it("should upload executable deploy then restart before returning (autodeploy=true, autostart=true)", async () => {

			// given
			_prepareUploadMocks(202);
			requestMock.query.autodeploy = true;
			requestMock.query.autostart = true;
			deploymentServiceMock.deploy.withArgs(_TEST_APP, _TEST_VERSION).returns({status: DeploymentStatus.DEPLOYED});
			deploymentServiceMock.restart.withArgs(_TEST_APP).returns(DeploymentStatus.UNKNOWN_STARTED);

			// when
			await uploadController.uploadExecutable(requestMock, responseMock);

			// then
			_verifyUploadResponse(DeploymentStatus.UNKNOWN_STARTED);
		});

		it("should upload executable deploy only before returning (autodeploy=true, autostart=true, non-successful deploy result)", async () => {

			// given
			_prepareUploadMocks(404);
			requestMock.query.autodeploy = true;
			requestMock.query.autostart = true;
			deploymentServiceMock.deploy.withArgs(_TEST_APP, _TEST_VERSION).returns({status: DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION});

			// when
			await uploadController.uploadExecutable(requestMock, responseMock);

			// then
			_verifyUploadResponse(DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION);
			sinon.assert.notCalled(deploymentServiceMock.restart);
		});

		function _prepareUploadMocks(expectedStatus) {
			requestMock.params = {
				app: _TEST_APP,
				version: _TEST_VERSION
			};
			requestMock.file = {
				originalname: "original_filename.jar"
			};
			requestMock.query = {};
			responseMock.status.withArgs(expectedStatus).returns(responseMock);
		}

		function _verifyUploadResponse(expectedDeploymentStatus) {
			const sendCallArgument = responseMock.send.getCall(0).args[0];
			assert.include(sendCallArgument.message, "Uploaded in");
			assert.equal(sendCallArgument.status, expectedDeploymentStatus);
			assert.equal(sendCallArgument.version, _TEST_VERSION);
		}
	});
});
