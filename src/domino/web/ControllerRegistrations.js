import WebErrorHandlers from "./error/handler/WebErrorHandlers";
import config from "config";

/**
 * Component to handle controller registrations.
 */
export default class ControllerRegistrations {

	constructor(multerFactory, uploadController, lifecycleController) {
		this._multer = multerFactory.createExpressMulter();
		this._uploadController = uploadController;
		this._lifecycleController = lifecycleController;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Starts registering routes.
	 *
	 * @param expressApp Express application object
	 */
	registerRoutes(expressApp) {

		// common middleware to mark call start time
		expressApp.use((req, resp, next) => {
			req.callStartTime = process.hrtime();
			next();
		});

		// upload controller registration
		if (this._storageConfig["enable-upload"]) {
			expressApp
				.post("/upload/:app/:version", this._multer.single("executable"),
					(req, resp) => this._uploadController.uploadExecutable(req, resp))
				.use(WebErrorHandlers.uploadErrorHandler);
		}

		expressApp
			.put("/lifecycle/:app/deploy", (req, resp) => this._lifecycleController.deploy(req, resp))
			.put("/lifecycle/:app/deploy/:version", (req, resp) => this._lifecycleController.deploy(req, resp))
			.put("/lifecycle/:app/start", (req, resp) => this._lifecycleController.start(req, resp))
			.put("/lifecycle/:app/restart", (req, resp) => this._lifecycleController.restart(req, resp))
			.delete("/lifecycle/:app/stop", (req, resp) => this._lifecycleController.stop(req, resp))
			.use(WebErrorHandlers.uploadErrorHandler);
	}
}
