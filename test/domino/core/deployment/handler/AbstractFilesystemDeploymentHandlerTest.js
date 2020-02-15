import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import FilenameUtility from "../../../../../src/domino/core/util/FilenameUtility";
import ExecutorUserRegistry from "../../../../../src/domino/core/registration/ExecutorUserRegistry";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import AbstractFilesystemDeploymentHandler from "../../../../../src/domino/core/deployment/handler/AbstractFilesystemDeploymentHandler";
import ExecutableVersion from "../../../../../src/domino/core/domain/ExecutableVersion";
import fs from "fs";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";
import {normalizePath} from "../../../testutils/TestUtils";
import NonExistingExecutableError from "../../../../../src/domino/core/error/NonExistingExecutableError";

const _STORAGE_CONFIG = {
	path: "/tmp/storage"
};
const _VERSION = new ExecutableVersion("1.2.3");
const _REGISTRATION = {
	appName: "app",
	source: {
		home: "/apps",
		resource: "app.jar"
	}
};
const _USER_ID = 1000;
const _SOURCE_FILENAME = "app-v1.2.3.jar";
const _SOURCE_PATH = `${_STORAGE_CONFIG.path}/${_SOURCE_FILENAME}`;
const _TARGET_PATH = `${_REGISTRATION.source.home}/${_REGISTRATION.source.resource}`;

describe("Unit tests for AbstractFilesystemDeploymentHandler", () => {

	let filenameUtilityMock = null;
	let executorUserRegistryMock = null;
	let configurationProviderMock = null;
	let abstractFilesystemDeploymentHandler = null;

	beforeEach(() => {
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);
		executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		configurationProviderMock.getStorageConfiguration.returns(_STORAGE_CONFIG);

		abstractFilesystemDeploymentHandler = new AbstractFilesystemDeploymentHandler(filenameUtilityMock,
			executorUserRegistryMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #deploy", () => {

		it("should successfully deploy file to target storage directory", async () => {

			// given
			executorUserRegistryMock.getUserID.withArgs(_REGISTRATION).returns(_USER_ID);
			filenameUtilityMock.createFilename.withArgs({
				originalname: _REGISTRATION.source.resource,
				app: _REGISTRATION.appName,
				version: _VERSION
			}).returns(_SOURCE_FILENAME);

			const fsExistsFake = sinon.fake.returns(true);
			const fsCopyFake = sinon.fake();
			const fsChmodFake = sinon.fake();
			const fsChownFake = sinon.fake();
			sinon.replace(fs, "existsSync", fsExistsFake);
			sinon.replace(fs, "copyFileSync", fsCopyFake);
			sinon.replace(fs, "chmodSync", fsChmodFake);
			sinon.replace(fs, "chownSync", fsChownFake);

			// when
			const result = await abstractFilesystemDeploymentHandler.deploy(_REGISTRATION, _VERSION);

			// then
			assert.deepEqual(result, {status: DeploymentStatus.DEPLOYED, version: _VERSION.getFormattedVersion()});
			_assertExistsCall(fsExistsFake);
			_assertCopyCall(fsCopyFake);
			_assertChmodCall(fsChmodFake);
			_assertChownCall(fsChownFake);
		});

		it("should fail to deploy file to target storage directory", async () => {

			// given
			executorUserRegistryMock.getUserID.withArgs(_REGISTRATION).returns(_USER_ID);
			filenameUtilityMock.createFilename.returns(_SOURCE_FILENAME);

			const fsExistsFake = sinon.fake.returns(true);
			const fsCopyFake = sinon.fake.throws(new Error("Copy failure"));
			const fsChmodFake = sinon.fake();
			const fsChownFake = sinon.fake();
			sinon.replace(fs, "existsSync", fsExistsFake);
			sinon.replace(fs, "copyFileSync", fsCopyFake);
			sinon.replace(fs, "chmodSync", fsChmodFake);
			sinon.replace(fs, "chownSync", fsChownFake);

			// when
			const result = await abstractFilesystemDeploymentHandler.deploy(_REGISTRATION, _VERSION);

			// then
			assert.deepEqual(result, {status: DeploymentStatus.DEPLOY_FAILED_UNKNOWN, version: _VERSION.getFormattedVersion()});
			_assertExistsCall(fsExistsFake);
			_assertCopyCall(fsCopyFake);
			sinon.assert.notCalled(fsChmodFake);
			sinon.assert.notCalled(fsChownFake);
		});

		it("should throw error if source binary does not exist", async () => {

			// given
			filenameUtilityMock.createFilename.returns(_SOURCE_FILENAME);
			const fsExistsFake = sinon.fake.returns(false);
			const fsCopyFake = sinon.fake();
			const fsChmodFake = sinon.fake();
			const fsChownFake = sinon.fake();
			sinon.replace(fs, "existsSync", fsExistsFake);
			sinon.replace(fs, "copyFileSync", fsCopyFake);
			sinon.replace(fs, "chmodSync", fsChmodFake);
			sinon.replace(fs, "chownSync", fsChownFake);

			try {

				// when
				await abstractFilesystemDeploymentHandler.deploy(_REGISTRATION, _VERSION);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				if (!(e instanceof NonExistingExecutableError)) {
					assert.fail("Test case should have thrown NonExistingExecutableError");
				}

				// exception expected
			}

			// then
			assert.isFalse(executorUserRegistryMock.getUserID.called);
			sinon.assert.notCalled(fsCopyFake);
			sinon.assert.notCalled(fsChmodFake);
			sinon.assert.notCalled(fsChownFake);
		});
	});

	function _assertExistsCall(fsExistsFake) {
		const path = normalizePath(fsExistsFake.lastArg);
		assert.equal(path, _SOURCE_PATH);
	}

	function _assertCopyCall(fsCopyFake) {
		const sourcePath = normalizePath(fsCopyFake.getCall(0).args[0]);
		const targetPath = normalizePath(fsCopyFake.getCall(0).args[1]);
		assert.equal(sourcePath, _SOURCE_PATH);
		assert.equal(targetPath, _TARGET_PATH);
	}

	function _assertChmodCall(fsChmodFake) {
		const targetPath = normalizePath(fsChmodFake.getCall(0).args[0]);
		const permission = fsChmodFake.getCall(0).args[1];
		assert.equal(targetPath, _TARGET_PATH);
		assert.equal(permission, 0o774);
	}

	function _assertChownCall(fsChownFake) {
		const targetPath = normalizePath(fsChownFake.getCall(0).args[0]);
		const userID = fsChownFake.getCall(0).args[1];
		const groupID = fsChownFake.getCall(0).args[2];
		assert.equal(targetPath, _TARGET_PATH);
		assert.equal(userID, _USER_ID);
		assert.equal(groupID, _USER_ID);
	}
});
