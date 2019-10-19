import fs from "fs";
import path from "path";
import logManager from "../../../domino_main";
import NonAcceptableMimeTypeError from "../error/NonAcceptableMimeTypeError";
import NonRegisteredAppError from "../error/NonRegisteredAppError";
import AlreadyExistingExecutableError from "../error/AlreadyExistingExecutableError";
import ExecutableVersion from "../../core/domain/ExecutableVersion";

const logger = logManager.createLogger("ExecutableUtility");

/**
 * File handling utilities.
 */
export default class ExecutableUtility {

	constructor(appRegistrationRegistry, filenameUtility, configurationProvider) {
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._storageConfig = configurationProvider.getStorageConfiguration();
		this._filenameUtility = filenameUtility;
	}

	/**
	 * Checks if the given file's MIME-type is allowed by the configuration.
	 *
	 * @param file file object (mimetype field must be existing)
	 * @returns {boolean} true if the MIME-type of the file is allowed, false otherwise
	 */
	isMimeAccepted(file) {
		return this._storageConfig["accepted-mime-types"].includes(file.mimetype);
	}

	/**
	 * Asserts that the given file's MIME-type is allowed by the configuration.
	 *
	 * @param file file object (mimetype and originalname fields must be existing)
	 * @throws NonAcceptableMimeTypeError if the MIME-type is not allowed
	 */
	assertAcceptedMime(file) {

		if (!this.isMimeAccepted(file)) {
			logger.error(`File with originalName=${file.originalname} has non-accepted mimeType=${file.mimetype} - rejecting upload`);
			throw new NonAcceptableMimeTypeError();
		}
	}

	/**
	 * Checks if the given application (in request parameters) is registered.
	 *
	 * @param requestParams parameter map object (app field must be existing)
	 * @returns {boolean} true if the application is registered, false otherwise
	 */
	isRegistered(requestParams) {
		return this._appRegistrationRegistry.getExistingRegistrations().includes(requestParams.app);
	}

	/**
	 * Asserts that the given application is registered.
	 *
	 * @param file file object (originalname fields must be existing)
	 * @param requestParams parameter map object (app field must be existing)
	 * @throws NonRegisteredAppError if the application is not registered
	 */
	assertRegisteredApp(file, requestParams) {

		if (!this.isRegistered(requestParams)) {
			logger.error(`File with originalName=${file.originalname} for app=${requestParams.app} is not registered - rejecting upload`);
			throw new NonRegisteredAppError();
		}
	}

	/**
	 * Checks if the given file exists on the storage path.
	 *
	 * @param file file object (originalname field must be existing)
	 * @param requestParams parameter map object (app and version fields must be existing)
	 * @returns {boolean} true if the file already exists, false otherwise
	 */
	exists(file, requestParams) {

		const filename = this._filenameUtility.createFilename({
			originalname: file.originalname,
			app: requestParams.app,
			version: new ExecutableVersion(requestParams.version)});
		const executablePath = path.join(this._storageConfig.path, filename);

		return fs.existsSync(executablePath);
	}

	/**
	 * Asserts that the given file is not existing.
	 *
	 * @param file file object (originalname field must be existing)
	 * @param requestParams parameter map object (app and version fields must be existing)
	 * @throws AlreadyExistingExecutableError if the file already exists
	 */
	assertNonExistingExecutable(file, requestParams) {

		if (this.exists(file, requestParams)) {
			logger.error(`File with originalName=${file.originalname} for app=${requestParams.app} with version=${requestParams.version} already exists - rejecting upload`);
			throw new AlreadyExistingExecutableError();
		}
	}
}
