import LoggerFactory from "../../../helper/LoggerFactory";
import {InfoStatus} from "../../domain/InfoStatus";
import {JSONPath} from 'jsonpath-plus';
import axios from "axios";

const logger = LoggerFactory.createLogger("InfoProvider");

const _NON_CONFIGURED_INFO_ENDPOINT = {status: InfoStatus.NON_CONFIGURED};
const _MISCONFIGURED_INFO_ENDPOINT = {status: InfoStatus.MISCONFIGURED};
const _FAILED_INFO_REQUEST = {status: InfoStatus.FAILED};

/**
 * Application info provider component.
 * Uses the registration's configured info endpoint.
 */
export default class InfoProvider {

	/**
	 * Retrieves application info for the given registration.
	 * Uses the configured endpoint and returns data based on the set response mapping.
	 * Response mapping should be provided in target-source pairs, where the source is a valid JSON path.
	 *
	 * @param registration AppRegistration object containing info endpoint parameters
	 * @returns {Promise<{}>} object with the resolved application info and the general response status
	 */
	async getAppInfo(registration) {

		return registration.appInfo.enabled
			? new Promise(resolve => this._doRequestAppInfo(registration, resolve))
			: (() => {
				logger.info(`Info endpoint is not configured for app=${registration.appName} - skipping`);
				return Promise.resolve(_NON_CONFIGURED_INFO_ENDPOINT);
			})();
	}

	_doRequestAppInfo(registration, resolve) {

		this._callAppInfoEndpoint(registration)
			.then(response => {
				if (response.status === 200) {
					resolve(this._processSuccessfulResponse(registration, response));
				} else {
					logger.error(`Application info endpoint returned response status ${response.status}`);
					resolve(_MISCONFIGURED_INFO_ENDPOINT);
				}
			})
			.catch(error => {
				logger.error(`Failed to reach application info endpoint - reason: ${error.message}`);
				resolve(_FAILED_INFO_REQUEST);
			});
	}

	_processSuccessfulResponse(registration, response) {

		const infoResponse = {
			status: InfoStatus.PROVIDED,
			info: {}
		};

		Object.keys(registration.appInfo.fieldMapping).forEach(key => {
			const nodeValue = JSONPath({
				json: response.data,
				path: registration.appInfo.fieldMapping[key]});
			if (nodeValue.length !== 1) {
				infoResponse.status = InfoStatus.MISCONFIGURED;
				logger.warn(`Application info endpoint is misconfigured, returned value=${nodeValue} for key=${key} - response will be deficient`);
			} else {
				infoResponse.info[key] = nodeValue[0];
			}
		});

		return infoResponse;
	}

	_callAppInfoEndpoint(registration) {

		const requestOptions = {
			method: "GET",
			url: registration.appInfo.endpoint
		};

		return axios(requestOptions);
	}
}
