import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ExecutableUtility from "../../../../src/domino/web/util/ExecutableUtility";
import FilenameUtility from "../../../../src/domino/core/util/FilenameUtility";
import RequestValidator from "../../../../src/domino/web/util/RequestValidator";
import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import ExpressMulterFactory from "../../../../src/domino/web/factory/ExpressMulterFactory";

const _TEST_STORAGE_CONFIG = {
	path: "/tmp/storage",
	"max-size": "10MB"
};

describe("Unit tests for ExpressMulterFactory", () => {

	let executableUtilityMock = null;
	let filenameUtilityMock = null;
	let requestValidatorMock = null;
	let configurationProviderMock = null;
	let expressMulterFactory = null;

	beforeEach(() => {
		executableUtilityMock = sinon.createStubInstance(ExecutableUtility);
		filenameUtilityMock = sinon.createStubInstance(FilenameUtility);
		requestValidatorMock = sinon.createStubInstance(RequestValidator);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		configurationProviderMock.getStorageConfiguration.returns(_TEST_STORAGE_CONFIG);

		expressMulterFactory = new ExpressMulterFactory(executableUtilityMock, filenameUtilityMock, requestValidatorMock, configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	const request = {
		params: {
			app: "app1",
			version: "1.2.3"
		}
	};
	const file = {
		originalname: "original-filename.jar"
	};
	const expectedFilename = "app1-1.2.3.jar";

	describe("Test scenarios for #createExpressMulter", () => {

		const filterFailureScenarios = [
			{message: "Invalid deployment request", mockReference: () => requestValidatorMock.assertValidDeploymentRequest},
			{message: "Non-acceptable MIME type", mockReference: () => executableUtilityMock.assertAcceptedMime},
			{message: "Non-registered app", mockReference: () => executableUtilityMock.assertRegisteredApp},
			{message: "Existing executable", mockReference: () => executableUtilityMock.assertNonExistingExecutable},
		];

		it("should configure Multer storage and limits properly", () => {

			// given
			filenameUtilityMock.createFilename.returns(expectedFilename);

			// when
			const result = expressMulterFactory.createExpressMulter();

			// then
			const storageConfig = result.storage;
			const limitsConfig = result.limits;

			// storage destination is configured
			storageConfig.getDestination({}, {}, (errorArg, path) => {
				assert.equal(path, _TEST_STORAGE_CONFIG.path);
			});

			// way of generating filename is configured
			storageConfig.getFilename(request, file, (errorArg, filename) => {
				assert.equal(filename, expectedFilename);
				const createFilenameCallParams = filenameUtilityMock.createFilename.getCall(0).args[0];
				assert.equal(createFilenameCallParams.originalname, file.originalname);
				assert.equal(createFilenameCallParams.app, request.params.app);
				assert.equal(createFilenameCallParams.version.getFormattedVersion(), request.params.version);
			});

			// limits are configured
			assert.equal(limitsConfig.fieldSize, _TEST_STORAGE_CONFIG["max-size"]);
		});

		it("should configure filter to return with true on successful validation", () => {

			// when
			const result = expressMulterFactory.createExpressMulter();

			// then
			const filterConfig = result.fileFilter;

			// filter is configured
			// calling the callback with true on successful validation
			filterConfig(request, file, (errorArg, filterResult) => {
				assert.isNull(errorArg);
				assert.isTrue(filterResult);
			});
		});

		filterFailureScenarios.forEach(scenario => {

			it(`should configure filter to return with error on validation failure [${scenario.message}]`, () => {

				// given
				scenario.mockReference().throws(new Error(scenario.message));


				// when
				const result = expressMulterFactory.createExpressMulter();

				// then
				const filterConfig = result.fileFilter;

				// filter is configured
				// calling the callback with the error on failed validation
				filterConfig(request, file, (errorArg, filterResult) => {
					assert.isNotNull(errorArg);
					assert.instanceOf(errorArg, Error);
					assert.equal(errorArg.message, scenario.message);
					assert.isUndefined(filterResult);
				});
			});
		});
	});
});
