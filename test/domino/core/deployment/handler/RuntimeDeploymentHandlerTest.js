import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import FilenameUtility from "../../../../../src/domino/core/util/FilenameUtility";
import ExecutorUserRegistry from "../../../../../src/domino/core/registration/ExecutorUserRegistry";
import ExecutableBinaryHandler from "../../../../../src/domino/core/deployment/handler/util/ExecutableBinaryHandler";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import {normalizePath} from "../../../testutils/TestUtils";
import RuntimeDeploymentHandler from "../../../../../src/domino/core/deployment/handler/RuntimeDeploymentHandler";
import AppRegistrationRegistry from "../../../../../src/domino/core/registration/AppRegistrationRegistry";

const _REGISTRATION = {
	appName: "app",
	source: {
		home: "/apps",
		resource: "app.jar"
	},
	execution: {
		args: ["arg1", "arg2"]
	}
};
const _USER_ID = 12;
const _RUNTIME_NAME = "java";
const _RUNTIME = {
	binary: "/usr/bin/java",
	resourceMarker: "-jar"
};
const _EXECUTABLE_PATH = "/apps/app.jar";

describe("Unit tests for RuntimeDeploymentHandler", () => {

	let filenameUtilityMock = null;
	let executorUserRegistryMock = null;
	let executableBinaryHandlerMock = null;
	let appRegistrationRegistryMock = null;
	let configurationProviderMock = null;
	let runtimeDeploymentHandler = null;

	beforeEach(() => {
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);
		executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
		executableBinaryHandlerMock = sinon.createStubInstance(ExecutableBinaryHandler);
		appRegistrationRegistryMock = sinon.createStubInstance(AppRegistrationRegistry);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		runtimeDeploymentHandler = new RuntimeDeploymentHandler(filenameUtilityMock, executorUserRegistryMock,
			executableBinaryHandlerMock, appRegistrationRegistryMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #_prepareSpawnParameters", () => {

		it("should properly prepare spawn parameters with multiple arguments", () => {

			// given
			const registration = _prepareRegistration(true, true);
			executorUserRegistryMock.getUserID.withArgs(registration).returns(_USER_ID);
			appRegistrationRegistryMock.getRuntime.withArgs(_RUNTIME_NAME).returns(_RUNTIME);

			// when
			const result = runtimeDeploymentHandler._prepareSpawnParameters(registration);

			// then
			assert.equal(normalizePath(result.executablePath), _RUNTIME.binary);
			assert.deepEqual(_normalizePathInArray(result.args, 3), ["arg1", "arg2", "-jar", _EXECUTABLE_PATH]);
			assert.equal(result.userID, _USER_ID);
			assert.equal(result.workDirectory, _REGISTRATION.source.home);
		});

		it("should properly prepare spawn parameters with single argument", () => {

			// given
			const registration = _prepareRegistration(true, false);
			executorUserRegistryMock.getUserID.withArgs(registration).returns(_USER_ID);
			appRegistrationRegistryMock.getRuntime.withArgs(_RUNTIME_NAME).returns(_RUNTIME);

			// when
			const result = runtimeDeploymentHandler._prepareSpawnParameters(registration);

			// then
			assert.equal(normalizePath(result.executablePath), _RUNTIME.binary);
			assert.deepEqual(_normalizePathInArray(result.args, 2), ["arg1", "-jar", _EXECUTABLE_PATH]);
			assert.equal(result.userID, _USER_ID);
			assert.equal(result.workDirectory, _REGISTRATION.source.home);
		});

		it("should throw error in case of missing runtime", () => {

			// given
			const registration = _prepareRegistration(false, false);

			try {

				// when
				runtimeDeploymentHandler._prepareSpawnParameters(registration);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				// exception expected
				assert.equal(e.message, `Runtime is not specified for runtime-execution app by appName=${_REGISTRATION.appName}`);
			}

		});

		function _prepareRegistration(withRuntime, withArrayOfArgs) {

			const runtimeRegistration = withRuntime
				? {runtime: _RUNTIME_NAME}
				: {};
			const registration = Object.assign(runtimeRegistration, _REGISTRATION);

			if (!withArrayOfArgs) {
				registration.execution.args = "arg1";
			}

			return registration;
		}

		function _normalizePathInArray(sourceArray, index) {
			sourceArray[index] = normalizePath(sourceArray[index]);
			return sourceArray;
		}
	});
});
