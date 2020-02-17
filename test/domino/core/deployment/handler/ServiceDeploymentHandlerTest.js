import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import FilenameUtility from "../../../../../src/domino/core/util/FilenameUtility";
import ExecutorUserRegistry from "../../../../../src/domino/core/registration/ExecutorUserRegistry";
import ServiceAdapterRegistry from "../../../../../src/domino/core/deployment/handler/service/ServiceAdapterRegistry";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import AbstractServiceAdapter from "../../../../../src/domino/core/deployment/handler/service/AbstractServiceAdapter";
import ServiceDeploymentHandler from "../../../../../src/domino/core/deployment/handler/ServiceDeploymentHandler";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";

const _REGISTRATION = {
	appName: "app",
	execution: {
		commandName: "test-app-service"
	}
};

describe("Unit tests for ServiceDeploymentHandler", () => {

	let filenameUtilityMock = null;
	let executorUserRegistryMock = null;
	let serviceAdapterRegistryMock = null;
	let configurationProviderMock = null;
	let serviceAdapterMock = null;
	let serviceDeploymentHandler = null;

	beforeEach(() => {
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);
		executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
		serviceAdapterRegistryMock = sinon.createStubInstance(ServiceAdapterRegistry);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		serviceAdapterMock = sinon.createStubInstance(AbstractServiceAdapter);

		serviceAdapterRegistryMock.getServiceAdapter.returns(serviceAdapterMock);

		serviceDeploymentHandler = new ServiceDeploymentHandler(filenameUtilityMock, executorUserRegistryMock,
			serviceAdapterRegistryMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #start", () => {

		it("should resolve with UNKNOWN_STARTED status", async () => {

			// when
			const result = await serviceDeploymentHandler.start(_REGISTRATION);

			// then
			sinon.assert.calledWith(serviceAdapterMock.start, _REGISTRATION.execution.commandName);
			assert.equal(result, DeploymentStatus.UNKNOWN_STARTED);
		});
	});

	describe("Test scenarios for #stop", () => {

		it("should resolve with STOPPED status", async () => {

			// when
			const result = await serviceDeploymentHandler.stop(_REGISTRATION);

			// then
			sinon.assert.calledWith(serviceAdapterMock.stop, _REGISTRATION.execution.commandName);
			assert.equal(result, DeploymentStatus.STOPPED);
		});
	});

	describe("Test scenarios for #restart", () => {

		it("should resolve with UNKNOWN_STARTED status", async () => {

			// when
			const result = await serviceDeploymentHandler.restart(_REGISTRATION);

			// then
			sinon.assert.calledWith(serviceAdapterMock.restart, _REGISTRATION.execution.commandName);
			assert.equal(result, DeploymentStatus.UNKNOWN_STARTED);
		});
	});
});
