import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import FilenameUtility from "../../../../../src/domino/core/util/FilenameUtility";
import ExecutorUserRegistry from "../../../../../src/domino/core/registration/ExecutorUserRegistry";
import ExecutableBinaryHandler from "../../../../../src/domino/core/deployment/handler/util/ExecutableBinaryHandler";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import AbstractSpawningDeploymentHandlerStub from "../../../testutils/AbstractSpawningDeploymentHandlerStub";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";

const _REGISTRATION = {appName: "app"};
const _SPAWN_PARAMETERS = {path: "/apps/app.jar"};

describe("Unit tests for AbstractSpawningDeploymentHandler", () => {

	let filenameUtilityMock = null;
	let executorUserRegistryMock = null;
	let executableBinaryHandlerMock = null;
	let configurationProviderMock = null;
	let abstractSpawningDeploymentHandler = null;

	beforeEach(() => {
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);
		executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
		executableBinaryHandlerMock = sinon.createStubInstance(ExecutableBinaryHandler);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		abstractSpawningDeploymentHandler = new AbstractSpawningDeploymentHandlerStub(filenameUtilityMock,
			executorUserRegistryMock, executableBinaryHandlerMock, configurationProviderMock);
		abstractSpawningDeploymentHandler.setSpawnParameters(_SPAWN_PARAMETERS);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #start", () => {

		it("should resolve with UNKNOWN_STARTED on successful start up", async () => {

			// given
			const processFakeObject = {
				pid: 123,
				unref: () => null
			};
			const processFake = sinon.stub(processFakeObject);
			executableBinaryHandlerMock.spawnProcess.withArgs(_SPAWN_PARAMETERS).returns(processFake);

			// when
			const result = await abstractSpawningDeploymentHandler.start(_REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STARTED);
			assert.isTrue(processFake.unref.called);
		});

		it("should resolve with START_FAILURE on failed startup", async () => {

			// given
			executableBinaryHandlerMock.spawnProcess.withArgs(_SPAWN_PARAMETERS).throws(new Error("startup failure"));

			// when
			const result = await abstractSpawningDeploymentHandler.start(_REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.START_FAILURE);
		});
	});

	describe("Test scenarios for #stop", () => {

		it("should stop and unregister process after successfully stopping app", async () => {

			// given
			const processObject = {pid: 234};
			abstractSpawningDeploymentHandler._processes[_REGISTRATION.appName] = processObject;
			executableBinaryHandlerMock.killProcess.withArgs(processObject, _REGISTRATION).resolves(DeploymentStatus.STOPPED);

			// when
			const result = await abstractSpawningDeploymentHandler.stop(_REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.STOPPED);
			assert.isTrue(abstractSpawningDeploymentHandler._processes.length === 0);
		});

		it("should stop and keep process registered after failing to stop app", async () => {

			// given
			const processObject = {pid: 234};
			abstractSpawningDeploymentHandler._processes[_REGISTRATION.appName] = processObject;
			executableBinaryHandlerMock.killProcess.withArgs(processObject, _REGISTRATION).resolves(DeploymentStatus.STOP_FAILURE);

			// when
			const result = await abstractSpawningDeploymentHandler.stop(_REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.STOP_FAILURE);
			assert.equal(abstractSpawningDeploymentHandler._processes[_REGISTRATION.appName], processObject);
		});
	});
});
