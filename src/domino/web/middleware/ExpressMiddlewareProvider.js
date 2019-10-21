import {
	HTTP_STATUS_BAD_REQUEST,
	HTTP_STATUS_CONFLICTING,
	HTTP_STATUS_FORBIDDEN,
	HTTP_STATUS_INTERNAL_SERVER_ERROR,
	HTTP_STATUS_NOT_ACCEPTABLE,
	HTTP_STATUS_NOT_FOUND
} from "../controller/BaseController";
import NonAcceptableMimeTypeError from "../error/NonAcceptableMimeTypeError";
import NonRegisteredAppError from "../error/NonRegisteredAppError";
import AlreadyExistingExecutableError from "../error/AlreadyExistingExecutableError";
import InvalidRequestError from "../error/InvalidRequestError";
import NonExistingExecutableError from "../../core/error/NonExistingExecutableError";
import AuthenticationError from "../error/AuthenticationError";
import logManager from "../../../domino_main";

const logger = logManager.createLogger("ExpressMiddlewareProvider");
const _PUBLIC_ENDPOINTS = [
	"/claim-token"
];

/**
 * Provider class for Express middleware implementations.
 */
export default class ExpressMiddlewareProvider {

	constructor(jwtUtility, configurationProvider) {
		this._jwtUtility = jwtUtility;
		this._securityConfig = configurationProvider.getSecurityConfig();
	}

	/**
	 * Provides an Express middleware for JWT token verification.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 * @param next reference of next middleware in chain
	 */
	jwtVerification(req, resp, next) {

		if (_PUBLIC_ENDPOINTS.includes(req.path)) {
			next();
		} else {
			try {
				this._jwtUtility.verifyToken(req.headers["authorization"]);
				next();
			} catch (e) {
				resp.status(HTTP_STATUS_FORBIDDEN)
					.send();
			}
		}
	}

	/**
	 * Verifies if the source of the request is allowed.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 * @param next reference of next middleware in chain
	 */
	remoteAddressVerification(req, resp, next) {

		const sourceAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
		const allowedSources = this._securityConfig["allowed-sources"];

		if (Array.isArray(allowedSources) && !allowedSources.includes(sourceAddress)) {
			logger.error(`Source=${sourceAddress} is not allowed - rejecting request`);
			throw new AuthenticationError("Request source address denied");
		}

		next();
	}

	/**
	 * Adds 'callStartTime' field to the request holding the timestamp (in ms) of the start of request processing.
	 * Call BaseController#getProcessingTime to measure request processing time.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 * @param next reference of next middleware in chain
	 */
	callStartMarker(req, resp, next) {
		req.callStartTime = process.hrtime();
		next();
	}

	/**
	 * Handles possible errors.
	 * Returns the following HTTP statuses:
	 *  - 400 (Bad request): request validation failure
	 *  - 403 (Forbidden): authentication failure (invalid credentials or token)
	 *  - 404 (Not found): requested executable cannot be found or not deployed yet
	 *  - 406 (Not acceptable): MIME type is not allowed or the requested application is not registered
	 *  - 409 (Conflicting): the executable binary being uploaded already exists
	 *  - 500 (Internal service error): any other (unhandled) processing error
	 *
	 * @param err error instance
	 * @param req Express request object
	 * @param resp Express response object
	 * @param next next handler reference
	 */
	defaultErrorHandler(err, req, resp, next) {

		let status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
		if (err instanceof NonAcceptableMimeTypeError || err instanceof NonRegisteredAppError) {
			status = HTTP_STATUS_NOT_ACCEPTABLE;
		} else if (err instanceof AlreadyExistingExecutableError) {
			status = HTTP_STATUS_CONFLICTING;
		} else if (err instanceof InvalidRequestError) {
			status = HTTP_STATUS_BAD_REQUEST;
		} else if (err instanceof NonExistingExecutableError) {
			status = HTTP_STATUS_NOT_FOUND;
		} else if (err instanceof AuthenticationError) {
			status = HTTP_STATUS_FORBIDDEN;
		} else {
			logger.error("Unhandled error occurred while uploading file\n", err);
			status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
		}

		resp.status(status).send();
	}
}
