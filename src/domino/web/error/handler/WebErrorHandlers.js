import {
	HTTP_STATUS_BAD_REQUEST,
	HTTP_STATUS_CONFLICTING,
	HTTP_STATUS_INTERNAL_SERVER_ERROR,
	HTTP_STATUS_NOT_ACCEPTABLE
} from "../../controller/BaseController";
import NonAcceptableMimeTypeError from "../NonAcceptableMimeTypeError";
import NonRegisteredAppError from "../NonRegisteredAppError";
import AlreadyExistingExecutableError from "../AlreadyExistingExecutableError";
import logManager from "../../../../domino_main";
import InvalidRequestError from "../InvalidRequestError";

const logger = logManager.createLogger("WebErrorHandlers");

/**
 * Error handlers for route registrations.
 */
export default class WebErrorHandlers {

	/**
	 * Handles possible errors during executable upload.
	 * Returns the following HTTP statuses:
	 *  - 400 (Bad request): request validation failure
	 *  - 406 (Not acceptable): MIME type is not allowed or the requested application is not registered
	 *  - 409 (Conflicting): the executable binary being uploaded already exists
	 *  - 500 (Internal service error): any other (unhandled) processing error
	 *
	 * @param err error instance
	 * @param req Express request object
	 * @param resp Express response object
	 * @param next next handler reference
	 */
	static uploadErrorHandler(err, req, resp, next) {

		let status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
		if (err instanceof NonAcceptableMimeTypeError || err instanceof NonRegisteredAppError) {
			status = HTTP_STATUS_NOT_ACCEPTABLE;
		} else if (err instanceof AlreadyExistingExecutableError) {
			status = HTTP_STATUS_CONFLICTING;
		} else if (err instanceof InvalidRequestError) {
			status = HTTP_STATUS_BAD_REQUEST;
		} else {
			logger.error("Unhandled error occurred while upload file\n", err);
			status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
		}

		resp.status(status).send();
	}
}