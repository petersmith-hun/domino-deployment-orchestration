import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import {ResponseStubTemplate, wait} from "../../testutils/TestUtils";
import BaseController from "../../../../src/domino/web/controller/BaseController";
import {DeploymentStatus} from "../../../../src/domino/core/domain/DeploymentStatus";

const _TEST_CONTROLLER_NAME = "test-controller";

describe("Unit tests for BaseController", () => {

	let requestMock = null;
	let responseMock = null;
	let baseController = null;

	beforeEach(() => {
		requestMock = sinon.stub();
		responseMock = sinon.createStubInstance(ResponseStubTemplate);

		baseController = new BaseController(_TEST_CONTROLLER_NAME);
	});

	describe("Test scenarios for #getProcessingTime", () => {

		it("should return actual processing time", async () => {

			// given
			requestMock.callStartTime = process.hrtime();
			await wait(1250);

			// when
			const result = baseController.getProcessingTime(requestMock);

			// then
			assert.isTrue(result >= 1250 && result < 1300);
		});

		it("should return 0 as processing time if call start time is not available", async () => {

			// when
			const result = baseController.getProcessingTime(requestMock);

			// then
			assert.equal(result, 0);
		});
	});

	describe("Test scenarios for #getControllerName", () => {

		it("should return the controller name passed in the constructor", () => {

			// when
			const result = baseController.getControllerName();

			// then
			assert.equal(result, _TEST_CONTROLLER_NAME);
		});
	});

	describe("Test scenarios for #mapDeploymentStatusToStatusCode", () => {

		const scenarios = [
			{deploymentStatus: DeploymentStatus.UPLOADED, expectedHttpStatus: 201},
			{deploymentStatus: DeploymentStatus.DEPLOYED, expectedHttpStatus: 201},
			{deploymentStatus: DeploymentStatus.STOPPED, expectedHttpStatus: 201},
			{deploymentStatus: DeploymentStatus.HEALTH_CHECK_OK, expectedHttpStatus: 201},
			{deploymentStatus: DeploymentStatus.UNKNOWN_STOPPED, expectedHttpStatus: 202},
			{deploymentStatus: DeploymentStatus.UNKNOWN_STARTED, expectedHttpStatus: 202},
			{deploymentStatus: DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION, expectedHttpStatus: 404},
			{deploymentStatus: DeploymentStatus.INVALID_REQUEST, expectedHttpStatus: 400},
			{deploymentStatus: DeploymentStatus.DEPLOY_FAILED_UNKNOWN, expectedHttpStatus: 500},
			{deploymentStatus: DeploymentStatus.START_FAILURE, expectedHttpStatus: 500},
			{deploymentStatus: DeploymentStatus.HEALTH_CHECK_FAILURE, expectedHttpStatus: 500},
			{deploymentStatus: DeploymentStatus.STOP_FAILURE, expectedHttpStatus: 500},
			{deploymentStatus: null, expectedHttpStatus: 500}
		];

		scenarios.forEach(scenario => {
			it(`should return the mapped HTTP status code: ${scenario.deploymentStatus} -> ${scenario.expectedHttpStatus}`, () => {

				// when
				const result = baseController.mapDeploymentStatusToStatusCode(scenario.deploymentStatus);

				// then
				assert.equal(result, scenario.expectedHttpStatus);
			});
		});
	});
});
