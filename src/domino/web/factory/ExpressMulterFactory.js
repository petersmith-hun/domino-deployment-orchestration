import config from "config";
import multer from "multer";

/**
 * Factory that creates a Multer multipart/form-data handler middleware for Express.
 */
export default class ExpressMulterFactory {

	constructor(executableUtility, filenameUtility, requestValidator) {
		this._executableUtility = executableUtility;
		this._filenameUtility = filenameUtility;
		this._requestValidator = requestValidator;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Creates a Multer instance.
	 *
	 * @returns {Multer|undefined} created Multer instance
	 */
	createExpressMulter() {
		return multer({
			storage: this._configureStorage(this._storageConfig, this._filenameUtility),
			fileFilter: this._configureFileFilter(this._executableUtility, this._requestValidator),
			limits: this._configureLimits()
		});
	}

	_configureStorage(storageConfig, filenameUtility) {
		return multer.diskStorage({
			destination: (req, file, cb) => cb(null, storageConfig.path),
			filename: (req, file, cb) => cb(null, filenameUtility.createFilename({
				originalname: file.originalname,
				app: req.params.app,
				version: req.params.version}))
		});
	}

	_configureFileFilter(executableUtility, requestValidator) {
		return function (req, file, cb) {
			try {
				requestValidator.assertValidDeploymentRequest(req.params);
				executableUtility.assertAcceptedMime(file);
				executableUtility.assertRegisteredApp(file, req.params);
				executableUtility.assertNonExistingExecutable(file, req.params);
				cb(null, true);
			} catch (error) {
				cb(error);
			}
		}
	}

	_configureLimits() {
		return {
			fieldSize: this._storageConfig["max-size"]
		}
	}
}