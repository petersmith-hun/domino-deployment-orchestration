export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ACCEPTED = 202;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_NOT_ACCEPTABLE = 406;
export const HTTP_STATUS_CONFLICTING = 409;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const SEC_TO_MS_MULTIPLIER = 1000;
const NS_TO_MS_DIVISOR = 1000 * 1000;

/**
 * Base controller.
 */
export default class BaseController {

	constructor(controllerName) {
		this._controllerName = controllerName;
	}

	/**
	 * Returns the processing time of the current request in milliseconds.
	 * If processing start time is not available, returns 0.
	 *
	 * @param req Express request object
	 * @returns {number} processing time in milliseconds.
	 */
	getProcessingTime(req) {

		let processingTime = 0;
		if (req.callStartTime) {
			let hrTimeDifference = process.hrtime(req.callStartTime);
			processingTime = parseInt(hrTimeDifference[0] * SEC_TO_MS_MULTIPLIER + hrTimeDifference[1] / NS_TO_MS_DIVISOR);
		}

		return processingTime;
	}

	/**
	 * Returns the name of the controllers - used during controller registration.
	 *
	 * @returns {string} name of the controller
	 */
	getControllerName() {
		return this._controllerName;
	}
}