import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";
import fs from "fs";

import AppRegistrationRegistry from "../../../../src/domino/core/registration/AppRegistrationRegistry";
import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import FilenameUtility from "../../../../src/domino/core/util/FilenameUtility";
import NonAcceptableMimeTypeError from "../../../../src/domino/web/error/NonAcceptableMimeTypeError";
import NonRegisteredAppError from "../../../../src/domino/web/error/NonRegisteredAppError";
import ExecutableUtility from "../../../../src/domino/web/util/ExecutableUtility";
import AlreadyExistingExecutableError from "../../../../src/domino/web/error/AlreadyExistingExecutableError";
import {normalizePath} from "../../testutils/TestUtils";

const _TEST_STORAGE_CONFIGURATION = {
	"accepted-mime-types": ["application/java-archive", "application/zip"],
	path: "/tmp/storage"
};
const _REGISTERED_APPS = ["app1", "app2"];

describe("Unit tests for ExecutableUtility", () => {

	let appRegistrationRegistryMock = null;
	let configurationProviderMock = null;
	let filenameUtilityMock = null;
	let executableUtility = null;

	beforeEach(() => {
		appRegistrationRegistryMock = sinon.createStubInstance(AppRegistrationRegistry);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);

		configurationProviderMock.getStorageConfiguration.returns(_TEST_STORAGE_CONFIGURATION);
		executableUtility = new ExecutableUtility(appRegistrationRegistryMock, filenameUtilityMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	const mimeAcceptScenarios = [
		{mime: _TEST_STORAGE_CONFIGURATION["accepted-mime-types"][0], expectedResult: true},
		{mime: _TEST_STORAGE_CONFIGURATION["accepted-mime-types"][1], expectedResult: true},
		{mime: "image/jpeg", expectedResult: false},
		{mime: null, expectedResult: false}
	];

	describe("Test scenarios for #isMimeAccepted", () => {

		mimeAcceptScenarios.forEach(scenario => {

			it(`should accept or reject mime type accordingly to the config [${scenario.mime} -> ${scenario.expectedResult}]`, () => {

				// given
				const file = {
					mimetype: scenario.mime
				};

				// when
				const result = executableUtility.isMimeAccepted(file);

				// then
				assert.equal(result, scenario.expectedResult);
			});
		});
	});

	describe("Test scenarios for #assertAcceptedMime", () => {

		mimeAcceptScenarios.forEach(scenario => {

			it(`should accept or reject (and throw error) mime type accordingly to the config [${scenario.mime} -> ${scenario.expectedResult}]`, () => {

				// given
				const file = {
					originalname: "original-filename.jar",
					mimetype: scenario.mime
				};

				try {

					// when
					executableUtility.assertAcceptedMime(file);

					if (!scenario.expectedResult) {
						assert.fail("Test scenario should have thrown error");
					}
				} catch (e) {

					// then
					if (!(e instanceof NonAcceptableMimeTypeError)) {
						assert.fail("Test scenario should have thrown NonAcceptableMimeTypeError");
					}

					if (scenario.expectedResult) {
						assert.fail("Test scenario should have not thrown error");
					}
				}
			});
		});
	});

	const registeredAppScenarios = [
		{app: "app1", expectedResult: true},
		{app: "app2", expectedResult: true},
		{app: "app-non-existing", expectedResult: false},
		{app: null, expectedResult: false}
	];

	describe("Test scenarios for #isRegistered", () => {

		registeredAppScenarios.forEach(scenario => {

			it(`should return registration status accordingly to config [${scenario.app} -> ${scenario.expectedResult}]`, () => {

				// given
				appRegistrationRegistryMock.getExistingRegistrations.returns(_REGISTERED_APPS);
				const requestParams = {
					app: scenario.app
				};

				// when
				const result = executableUtility.isRegistered(requestParams);

				// then
				assert.equal(result, scenario.expectedResult);
			});
		});
	});

	describe("Test scenarios for #assertRegisteredApp", () => {

		registeredAppScenarios.forEach(scenario => {

			it(`should return registration status accordingly to config (and throw error on rejection) [${scenario.app} -> ${scenario.expectedResult}]`, () => {

				// given
				appRegistrationRegistryMock.getExistingRegistrations.returns(_REGISTERED_APPS);
				const requestParams = {
					app: scenario.app
				};
				const file = {
					originalname: "original-filename.jar"
				};

				try {

					// when
					executableUtility.assertRegisteredApp(file, requestParams);

					if (!scenario.expectedResult) {
						assert.fail("Test scenario should have thrown error");
					}
				} catch (e) {

					// then
					if (!(e instanceof NonRegisteredAppError)) {
						assert.fail("Test scenario should have thrown NonRegisteredAppError");
					}

					if (scenario.expectedResult) {
						assert.fail("Test scenario should have not thrown error");
					}
				}
			});
		});
	});

	describe("Test scenarios for #exists", () => {

		it("should properly prepare filename for fs.existsSync call", () => {

			// given
			const file = {
				originalname: "original-filename.jar"
			};
			const requestParams = {
				app: "app1",
				version: "1.2.3"
			};
			const expectedFilename = "app1-1.2.3.jar";
			filenameUtilityMock.createFilename.returns(expectedFilename);
			const fsExistsFake = sinon.fake.returns(true);
			sinon.replace(fs, 'existsSync', fsExistsFake);

			// when
			const result = executableUtility.exists(file, requestParams);

			// then
			assert.isTrue(result);

			const createFilenameCallParams = filenameUtilityMock.createFilename.getCall(0).args[0];
			assert.equal(createFilenameCallParams.originalname, file.originalname);
			assert.equal(createFilenameCallParams.app, requestParams.app);
			assert.equal(createFilenameCallParams.version.getFormattedVersion(), requestParams.version);

			const fsExistsCallArgNormalized = normalizePath(fsExistsFake.lastArg);
			assert.equal(fsExistsCallArgNormalized, _TEST_STORAGE_CONFIGURATION.path + "/" + expectedFilename);
		});
	});

	describe("Test scenarios for #assertNonExistingExecutable", () => {

		it("should silently fall through in case of non-existing file", () => {

			// given
			filenameUtilityMock.createFilename.returns("exec.jar");
			const fsExistsFake = sinon.fake.returns(false);
			sinon.replace(fs, 'existsSync', fsExistsFake);

			// when
			executableUtility.assertNonExistingExecutable({}, {version: "1"});

			// then
			// expected to fall-through silently
		});

		it("should throw error in case of existing file", () => {

			// given
			filenameUtilityMock.createFilename.returns("exec.jar");
			const fsExistsFake = sinon.fake.returns(true);
			sinon.replace(fs, 'existsSync', fsExistsFake);

			try {

				// when
				executableUtility.assertNonExistingExecutable({originalname: "original-filename.jar"}, {app: "app1", version: "1"});

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				if (!(e instanceof AlreadyExistingExecutableError)) {
					assert.fail("Test case should have thrown AlreadyExistingExecutableError");
				}

				// expected error
			}
		});
	});
});
