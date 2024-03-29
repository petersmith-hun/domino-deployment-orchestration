import rTracer from "cls-rtracer";
import {requiredScopes} from "express-oauth2-jwt-bearer";
import {AuthorizationMode} from "../core/domain/AuthorizationMode";
import {Scope} from "./security/Scope";

/**
 * Component to handle controller registrations.
 */
export default class ControllerRegistrations {

	constructor(multerFactory, configurationProvider, expressMiddlewareProvider, ...controllers) {
		this._multer = multerFactory.createExpressMulter();
		this._storageConfig = configurationProvider.getStorageConfiguration();
		this._authorizationMode = configurationProvider.getAuthorizationMode();
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
			.use(rTracer.expressMiddleware())
			.use((req, resp, next) => this._expressMiddlewareProvider.remoteAddressVerification(req, resp, next))
			.use((req, resp, next) => this._expressMiddlewareProvider.jwtVerification(req, resp, next))
			.use(this._expressMiddlewareProvider.oauthJWTVerification())
			.use((req, resp, next) => this._expressMiddlewareProvider.callStartMarker(req, resp, next));

		const uploadController = this._assertAndReturnController("upload");
		const lifecycleController = this._assertAndReturnController("lifecycle");
		const authenticationController = this._assertAndReturnController("auth");

		// upload controller registration
		if (this._storageConfig["enable-upload"]) {
			expressApp
				.post("/upload/:app/:version", this._hasScope(Scope.WRITE_UPLOAD), this._multer.single("executable"),
					this._wrapAsyncError(async (req, resp) => uploadController.uploadExecutable(req, resp)))
				.use((err, req, resp, next) => this._expressMiddlewareProvider.defaultErrorHandler(err, req, resp, next));
		}

		// lifecycle controller registrations
		expressApp
			.get("/lifecycle/:app/info", this._hasScope(Scope.READ_INFO), this._wrapAsyncError(async (req, resp) => lifecycleController.getInfo(req, resp)))
			.put("/lifecycle/:app/deploy", this._hasScope(Scope.WRITE_DEPLOY), this._wrapAsyncError(async (req, resp) => lifecycleController.deploy(req, resp)))
			.put("/lifecycle/:app/deploy/:version", this._hasScope(Scope.WRITE_DEPLOY), this._wrapAsyncError(async (req, resp) => lifecycleController.deploy(req, resp)))
			.put("/lifecycle/:app/start", this._hasScope(Scope.WRITE_START), this._wrapAsyncError(async (req, resp) => lifecycleController.start(req, resp)))
			.put("/lifecycle/:app/restart", this._hasScope(Scope.WRITE_RESTART), this._wrapAsyncError(async (req, resp) => lifecycleController.restart(req, resp)))
			.delete("/lifecycle/:app/stop", this._hasScope(Scope.WRITE_DELETE), this._wrapAsyncError(async (req, resp) => lifecycleController.stop(req, resp)))
			.use((err, req, resp, next) => this._expressMiddlewareProvider.defaultErrorHandler(err, req, resp, next));

		// authentication controller registrations
		expressApp
			.post("/claim-token", (req, resp) => authenticationController.claimToken(req, resp))
			.use((err, req, resp, next) => this._expressMiddlewareProvider.defaultErrorHandler(err, req, resp, next));
	}

	_assertAndReturnController(controllerName) {

		const controller = this._controllerMap.get(controllerName);
		if (!controller) {
			throw new Error(`Failed to register controller=${controllerName} - stopping.`);
		}

		return controller;
	}

	_hasScope(scope) {

		return this._authorizationMode === AuthorizationMode.OAUTH
			? requiredScopes(scope)
			: (req, resp, next) => next();
	}

	_wrapAsyncError(endpointRegistration) {
		return this._expressMiddlewareProvider.asyncErrorHandler(endpointRegistration);
	}
}
