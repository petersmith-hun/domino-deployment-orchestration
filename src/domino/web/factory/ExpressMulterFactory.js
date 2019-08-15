import config from "config";
import multer from "multer";

/**
 * Factory that creates a Multer multipart/form-data handler middleware for Express.
 */
export default class ExpressMulterFactory {

	constructor(executableUtility) {
		this._executableUtility = executableUtility;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Creates a Multer instance.
	 *
	 * @returns {Multer|undefined} created Multer instance
	 */
	createExpressMulter() {
		return multer({
			storage: this._configureStorage(this._storageConfig, this._executableUtility),
			fileFilter: this._configureFileFilter(this._executableUtility),
			limits: this._configureLimits()
		});
	}

	_configureStorage(storageConfig, executableUtility) {
		return multer.diskStorage({
			destination: (req, file, cb) => cb(null, storageConfig.path),
			filename: (req, file, cb) => cb(null, executableUtility.createFilename(file, req.params))
		});
	}

	_configureFileFilter(executableUtility) {
		return function (req, file, cb) {
			try {
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