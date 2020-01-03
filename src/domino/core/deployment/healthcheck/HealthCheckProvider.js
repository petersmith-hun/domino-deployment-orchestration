import LoggerFactory from "../../../helper/LoggerFactory";
import rp from "request-promise";
import {DeploymentStatus} from "../../domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("HealthCheckProvider");

/**
 * Component to perform health check of the started applications.
 */
export default class HealthCheckProvider {

	/**
	 * Starts executing health check.
	 *
	 * @param registration AppRegistration object containing health-check parameters.
	 * @returns {Promise} object wrapping the health-check execution
	 */
	async executeHealthCheck(registration) {
		logger.info(`Executing health-check for app=${registration.appName} (delay: ${registration.healthCheck.delay} ms; response timeout: ${registration.healthCheck.timeout} ms)`);

		return await registration.healthCheck.enabled
			? new Promise(resolve => this._doExecuteHealthCheck(registration, registration.healthCheck.maxAttempts, resolve))
			: (() => {
				logger.info(`Health-check execution for app=${registration.appName} is disabled - skipping`);
				return Promise.resolve(DeploymentStatus.UNKNOWN_STARTED);
			})();
	}

	_doExecuteHealthCheck(registration, attemptsLeft, resolve) {

		logger.info(`Waiting for health-check... (${attemptsLeft} attempts left)`);

		const retryDelay = registration.healthCheck.delay;
		const callLoop = setInterval(async () => {

			attemptsLeft--;
			await this._callHealthCheckEndpoint(registration)
				.then((response) => {
					this._handleResponse(registration, response.statusCode, attemptsLeft, resolve, callLoop);
				})
				.catch((error) => {
					logger.error(`Failed to reach application health-check endpoint - reason: ${error.message}`);
					this._handleResponse(registration, 503, attemptsLeft, resolve, callLoop);
				});

		}, retryDelay);
	}

	_handleResponse(registration, status, attemptsLeft, promiseResolution, callLoopHandler) {

		if (status !== 200) {
			logger.warn(`Health-check returned with status=${status}`);
			if (attemptsLeft === 0) {
				logger.error(`Number of health-check attempts reached limit=${registration.healthCheck.maxAttempts} - app is supposedly down`);
				this._stopLoop(promiseResolution, callLoopHandler, DeploymentStatus.HEALTH_CHECK_FAILURE);
			} else {
				logger.info(`Waiting for health-check... (${attemptsLeft} attempts left)`);
			}
		} else {
			logger.info(`Application=${registration.appName} reports successful health-check.`);
			this._stopLoop(promiseResolution, callLoopHandler, DeploymentStatus.HEALTH_CHECK_OK);
		}
	}

	_callHealthCheckEndpoint(registration) {

		const requestOptions = {
			method: "GET",
			uri: registration.healthCheck.endpoint,
			json: true,
			resolveWithFullResponse: true,
			timeout: registration.healthCheck.timeout,
			simple: false
		};

		return rp(requestOptions);
	}

	_stopLoop(promiseResolution, intervalHandlerReference, successful) {
		clearInterval(intervalHandlerReference);
		promiseResolution(successful);
	}
}
