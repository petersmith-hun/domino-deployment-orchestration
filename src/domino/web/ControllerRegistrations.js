/**
 * Component to handle controller registrations.
 */
export default class ControllerRegistrations {

	constructor(multerFactory, configurationProvider, expressMiddlewareProvider, ...controllers) {
		this._multer = multerFactory.createExpressMulter();
		this._storageConfig = configurationProvider.getStorageConfiguration();
		this._expressMiddlewareProvider = expressMiddlewareProvider;
		this._controllerMap = new Map(controllers.map(controller => [controller.getControllerName(), controller]));
	}

	/**
	 * Starts registering routes.
	 *
	 * @param expressApp Express application object
	 */
	registerRoutes(expressApp) {

		expressApp
			.use((req, resp, next) => this._expressMiddlewareProvider.remoteAddressVerification(req, resp, next))
			.use((req, resp, next) => this._expressMiddlewareProvider.jwtVerification(req, resp, next))
			.use((req, resp, next) => this._expressMiddlewareProvider.callStartMarker(req, resp, next));

		// upload controller registration
		if (this._storageConfig["enable-upload"]) {
			expressApp
				.post("/upload/:app/:version", this._multer.single("executable"),
					(req, resp) => this._controllerMap.get("upload").uploadExecutable(req, resp))
				.use((err, req, resp, next) => this._expressMiddlewareProvider.defaultErrorHandler(err, req, resp, next));
		}

		// lifecycle controller registrations
		expressApp
			.put("/lifecycle/:app/deploy", (req, resp) => this._controllerMap.get("lifecycle").deploy(req, resp))
			.put("/lifecycle/:app/deploy/:version", (req, resp) => this._controllerMap.get("lifecycle").deploy(req, resp))
			.put("/lifecycle/:app/start", (req, resp) => this._controllerMap.get("lifecycle").start(req, resp))
			.put("/lifecycle/:app/restart", async (req, resp) => this._controllerMap.get("lifecycle").restart(req, resp))
			.delete("/lifecycle/:app/stop", (req, resp) => this._controllerMap.get("lifecycle").stop(req, resp))
			.use((err, req, resp, next) => this._expressMiddlewareProvider.defaultErrorHandler(err, req, resp, next));

		// authentication controller registrations
		expressApp
			.post("/claim-token", (req, resp) => this._controllerMap.get("auth").claimToken(req, resp))
			.use((err, req, resp, next) => this._expressMiddlewareProvider.defaultErrorHandler(err, req, resp, next));
	}
}
