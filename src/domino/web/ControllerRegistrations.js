import WebErrorHandlers from "./error/handler/WebErrorHandlers";

/**
 * Component to handle controller registrations.
 */
export default class ControllerRegistrations {

	constructor(multerFactory, uploadController) {
		this._multer = multerFactory.createExpressMulter();
		this._uploadController = uploadController;
	}

	/**
	 * Starts registering routes.
	 *
	 * @param app Express application object
	 */
	registerRoutes(app) {

		// TODO add switch to enable/disable this endpoint

		// upload controller registration
		app
			.post("/upload/:app/:version", this._multer.single("executable"),
				(req, resp) => this._uploadController.uploadExecutable(req, resp))
			.use(WebErrorHandlers.uploadErrorHandler);
	}
}
