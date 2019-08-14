import config from "config";
import multer from "multer";
import logManager from "../../../domino_main";
import NonAcceptableMimeTypeError from "../error/NonAcceptableMimeTypeError";
import NonRegisteredAppError from "../error/NonRegisteredAppError";

const logger = logManager.createLogger("ExpressMulterFactory");

/**
 * Factory that creates a Multer multipart/form-data handler middleware for Express.
 */
export default class ExpressMulterFactory {

	constructor(appRegistrationRegistry) {
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Creates a Multer instance.
	 *
	 * @returns {Multer|undefined} created Multer instance
	 */
	createExpressMulter() {
		return multer({
			storage: this._configureStorage(this._storageConfig),
			fileFilter: this._configureFileFilter(this._appRegistrationRegistry, this._storageConfig),
			limits: this._configureLimits()
		});
	}

	_configureStorage(storageConfig) {
		return multer.diskStorage({
			destination: function (req, file, cb) {
				cb(null, storageConfig.path)
			},
			filename: function (req, file, cb) {

				let filenameParts = file.originalname.split('.');
				let extension = filenameParts[filenameParts.length - 1];
				let filename = `executable-${req.params.app}-v${req.params.version}.${extension}`;

				cb(null, filename)
			}
		});
	}

	_configureFileFilter(appRegistrationRegistry, storageConfig) {
		return function (req, file, cb) {

			let error = null;
			if (!storageConfig["accepted-mime-types"].includes(file.mimetype)) {
				logger.warn(`File with originalName=${file.originalname} has non-accepted mimeType=${file.mimetype} - rejecting upload`);
				error = new NonAcceptableMimeTypeError();
			}

			if (!(error || appRegistrationRegistry.getExistingRegistrations().includes(req.params.app))) {
				logger.warn(`File with originalName=${file.originalname} for app=${req.params.app} is not registered - rejecting upload`);
				error = new NonRegisteredAppError();
			}

			// TODO add file existence check

			cb(error, true);
		}
	}

	_configureLimits() {
		return {
			fieldSize: this._storageConfig["max-size"]
		}
	}
}