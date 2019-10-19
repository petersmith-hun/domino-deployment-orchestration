import logManager from "../../../domino_main";
import InvalidRequestError from "../error/InvalidRequestError";

const logger = logManager.createLogger("RequestValidator");
const _APP_NAME_MATCHER = /^[a-z]+$/;
const _VERSION_NUMBER_MATCHER = /^[a-zA-Z0-9.\-_]+$/;
const _PARAMETER_APP = "app";
const _PARAMETER_VERSION = "version";

/**
 * Validates a REST request.
 */
export default class RequestValidator {

	/**
	 * Validates a deployment request.
	 * Request must contain the 'app' and 'version' parameters with the following restrictions:
	 *  - 'app' parameter must contain only lowercase letters (ex.: domino is a valid name, Dom1no is not)
	 *  - 'version' parameter can contain upper- and lowercase letters, number, also dot, underscore and dash,
	 *  	no other special characters are accepted (ex.: 1.0.8, 1.0.8-beta, 1.0.8_RELEASE are accepted, 1.0.8@beta is not)
	 *
	 * @param requestParams HTTP request parameters
	 * @returns {boolean} true if the provided parameters are valid, false otherwise
	 */
	isUploadRequestValid(requestParams) {

		return this._requiredParametersPresent(requestParams, [_PARAMETER_APP, _PARAMETER_VERSION])
			&& this._isAppNameValid(requestParams)
			&& this._isVersionValid(requestParams);
	}

	/**
	 * Validates a lifecycle request.
	 * Request must contain the 'app' parameter, and it can optionally contain the 'version' parameter with the same restrictions
	 * specified for RequestValidator#isUploadRequestValid method.
	 *
	 * @param requestParams HTTP request parameters
	 * @returns {boolean} true if the provided parameters are valid, false otherwise
	 */
	isLifecycleRequestValid(requestParams) {

		return this._requiredParametersPresent(requestParams, [_PARAMETER_APP])
			&& this._isAppNameValid(requestParams)
			&& (requestParams[_PARAMETER_VERSION] === undefined || this._isVersionValid(requestParams));
	}

	/**
	 * Asserts that the given deployment request is valid.
	 * For more information please see RequestValidator#isUploadRequestValid method.
	 *
	 * @see RequestValidator#isUploadRequestValid
	 * @param requestParams HTTP request parameters
	 * @throws InvalidRequestError if the provided HTTP request is invalid
	 */
	assertValidDeploymentRequest(requestParams) {

		if (!this.isUploadRequestValid(requestParams)) {
			throw new InvalidRequestError();
		}
	}

	_requiredParametersPresent(requestParams, requiredParameters) {

		let valid = true;
		for (let parameter of requiredParameters) {
			valid = requestParams.hasOwnProperty(parameter) && requestParams[parameter] !== null;

			if (!valid) {
				logger.warn(`Parameter=${parameter} is missing from request`);
				break;
			}
		}

		return valid;
	}

	_isAppNameValid(requestParams) {
		return this._doValidate(requestParams.app, _APP_NAME_MATCHER, _PARAMETER_APP);
	}

	_isVersionValid(requestParams) {
		return this._doValidate(requestParams.version, _VERSION_NUMBER_MATCHER, _PARAMETER_VERSION);
	}

	_doValidate(parameter, matcher, logAsField) {

		const valid = parameter.match(matcher) !== null;
		if (!valid) {
			logger.warn(`Provided ${logAsField}=${parameter} is invalid - it should match '${matcher.toString()}'`);
		}

		return valid;
	}
}
