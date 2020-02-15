import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ExecutableDeploymentHandler from "../../../../src/domino/core/deployment/handler/ExecutableDeploymentHandler";
import RuntimeDeploymentHandler from "../../../../src/domino/core/deployment/handler/RuntimeDeploymentHandler";
import ServiceDeploymentHandler from "../../../../src/domino/core/deployment/handler/ServiceDeploymentHandler";
import DeploymentHandlerRegistry from "../../../../src/domino/core/deployment/DeploymentHandlerRegistry";
import UnsupportedDeploymentMode from "../../../../src/domino/core/error/UnsupportedDeploymentMode";

describe("Unit tests for DeploymentHandlerRegistry", () => {

	let executableDeploymentHandlerMock = null;
	let runtimeDeploymentHandlerMock = null;
	let serviceDeploymentHandlerMock = null;
	let deploymentHandlerRegistry = null;

	beforeEach(() => {
		executableDeploymentHandlerMock = sinon.createStubInstance(ExecutableDeploymentHandler);
		runtimeDeploymentHandlerMock = sinon.createStubInstance(RuntimeDeploymentHandler);
		serviceDeploymentHandlerMock = sinon.createStubInstance(ServiceDeploymentHandler);

		deploymentHandlerRegistry = new DeploymentHandlerRegistry(executableDeploymentHandlerMock,
			runtimeDeploymentHandlerMock, serviceDeploymentHandlerMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #getHandler", () => {

		const getHandlerScenarios = [
			{sourceType: "filesystem", executionMode: "executable", expectedHandler: () => executableDeploymentHandlerMock},
			{sourceType: "filesystem", executionMode: "runtime", expectedHandler: () => runtimeDeploymentHandlerMock},
			{sourceType: "filesystem", executionMode: "service", expectedHandler: () => serviceDeploymentHandlerMock},
			{sourceType: "FILESYSTEM", executionMode: "EXECUTABLE", expectedHandler: () => executableDeploymentHandlerMock},
			{sourceType: "FILESYSTEM", executionMode: "RUNTIME", expectedHandler: () => runtimeDeploymentHandlerMock},
			{sourceType: "FILESYSTEM", executionMode: "SERVICE", expectedHandler: () => serviceDeploymentHandlerMock}
		];

		getHandlerScenarios.forEach(scenario => {

			it(`should return the proper existing handler [${scenario.sourceType}/${scenario.executionMode}]`, () => {

				// given
				const registration = _prepareRegistration(scenario);

				// when
				const result = deploymentHandlerRegistry.getHandler(registration);

				// then
				assert.equal(result, scenario.expectedHandler());
			});
		});

		const getHandlerErrorScenarios = [
			{sourceType: "docker", executionMode: "image"},
			{sourceType: "filesystem", executionMode: "zip"},
			{sourceType: "filesystem", executionMode: null},
			{sourceType: null, executionMode: null}
		];

		getHandlerErrorScenarios.forEach(scenario => {

			it(`should throw error in case of non-existing handler [${scenario.sourceType}/${scenario.executionMode}]`, () => {

				// given
				const registration = _prepareRegistration(scenario);

				try {

					// when
					deploymentHandlerRegistry.getHandler(registration);

					assert.fail("Test case should have thrown error");
				} catch (e) {

					// then
					if (!(e instanceof UnsupportedDeploymentMode)) {
						assert.fail("Test case should have thrown UnsupportedDeploymentModeError");
					}

					// exception expected
				}
			});
		});

		function _prepareRegistration(scenario) {

			return {
				source: {
					type: scenario.sourceType
				},
				execution: {
					executionHandler: scenario.executionMode
				}
			};
		}
	});
});
