import WebErrorHandlers from "./error/handler/WebErrorHandlers";
import config from "config";

/**
 * Component to handle controller registrations.
 */
export default class ControllerRegistrations {

	constructor(multerFactory, uploadController) {
		this._multer = multerFactory.createExpressMulter();
		this._uploadController = uploadController;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Starts registering routes.
	 *
	 * @param expressApp Express application object
	 */
	registerRoutes(expressApp) {

		// upload controller registration
		if (this._storageConfig["enable-upload"]) {
			expressApp
				.post("/upload/:app/:version", this._multer.single("executable"),
					(req, resp) => this._uploadController.uploadExecutable(req, resp))
				.use(WebErrorHandlers.uploadErrorHandler);
		}
	}
}
