import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import FilenameUtility from "../../../../../src/domino/core/util/FilenameUtility";
import ExecutorUserRegistry from "../../../../../src/domino/core/registration/ExecutorUserRegistry";
import ExecutableBinaryHandler from "../../../../../src/domino/core/deployment/handler/util/ExecutableBinaryHandler";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import ExecutableDeploymentHandler from "../../../../../src/domino/core/deployment/handler/ExecutableDeploymentHandler";
import {normalizePath} from "../../../testutils/TestUtils";

const _REGISTRATION = {
	source: {
		home: "/apps",
		resource: "app.jar"
	},
	execution: {
		args: ["arg1", "arg2"]
	}
};
const _USER_ID = 12;
const _EXECUTABLE_PATH = "/apps/app.jar";

describe("Unit tests for ExecutableDeploymentHandler", () => {

	let filenameUtilityMock = null;
	let executorUserRegistryMock = null;
	let executableBinaryHandlerMock = null;
	let configurationProviderMock = null;
	let executableDeploymentHandler = null;

	beforeEach(() => {
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);
		executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
		executableBinaryHandlerMock = sinon.createStubInstance(ExecutableBinaryHandler);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		executableDeploymentHandler = new ExecutableDeploymentHandler(filenameUtilityMock, executorUserRegistryMock,
			executableBinaryHandlerMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #_prepareSpawnParameters", () => {

		it("should properly prepare spawn parameters", () => {

			// given
			executorUserRegistryMock.getUserID.withArgs(_REGISTRATION).returns(_USER_ID);

			// when
			const result = executableDeploymentHandler._prepareSpawnParameters(_REGISTRATION);

			// then
			assert.equal(normalizePath(result.executablePath), _EXECUTABLE_PATH);
			assert.equal(result.args, _REGISTRATION.execution.args);
			assert.equal(result.userID, _USER_ID);
			assert.equal(result.workDirectory, _REGISTRATION.source.home);
		});
	});
});
