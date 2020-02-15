import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import AbstractDeploymentHandlerStub from "../../../testutils/AbstractDeploymentHandlerStub";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";

const _REGISTRATION = {appName: "app"};
const _START_TIMEOUT = 150;

describe("Unit tests for AbstractDeploymentHandler", () => {

	let configurationProviderMock = null;
	let abstractDeploymentHandler = null;

	beforeEach(() => {
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		configurationProviderMock.getStartTimeout.returns(_START_TIMEOUT);

		abstractDeploymentHandler = new AbstractDeploymentHandlerStub(configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #restart", () => {

		const restartScenarios = [
			{stopResolution: DeploymentStatus.STOPPED, startResolution: DeploymentStatus.UNKNOWN_STARTED, expectedResolution: DeploymentStatus.UNKNOWN_STARTED},
			{stopResolution: DeploymentStatus.UNKNOWN_STOPPED, startResolution: DeploymentStatus.UNKNOWN_STARTED, expectedResolution: DeploymentStatus.UNKNOWN_STARTED},
			{stopResolution: DeploymentStatus.UNKNOWN_STOPPED, startResolution: DeploymentStatus.START_FAILURE, expectedResolution: DeploymentStatus.START_FAILURE},
			{stopResolution: DeploymentStatus.STOP_FAILURE, startResolution: null, expectedResolution: DeploymentStatus.STOP_FAILURE},
		];

		restartScenarios.forEach(scenario => {

			it(`should restart the application [stop:${scenario.stopResolution}; start:${scenario.startResolution} -> expected:${scenario.expectedResolution}]`, async () => {

				// given
				abstractDeploymentHandler.setStopResolution(scenario.stopResolution);
				abstractDeploymentHandler.setStartResolution(scenario.startResolution);

				// when
				const startTime = process.hrtime();
				const result = await abstractDeploymentHandler.restart(_REGISTRATION);
				const finishTime = process.hrtime(startTime);

				// then
				assert.equal(result, scenario.expectedResolution);
				assert.equal(finishTime[1] / 1000000 > _START_TIMEOUT, scenario.startResolution !== null);
			});
		});
	});
});
