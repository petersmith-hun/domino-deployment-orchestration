import config from "config";
import {AuthorizationMode} from "../domain/AuthorizationMode";

/**
 * Wrapper component for config.get calls.
 */
export default class ConfigurationProvider {

	/**
	 * Returns server configuration parameters:
	 *  - host (string)
	 *  - port (integer)
	 *
	 * @returns server configuration parameters
	 */
	getServerConfiguration() {
		return config.get("domino.server");
	}

	/**
	 * Returns storage configuration parameters:
	 *  - enable-upload (boolean)
	 *  - accepted-mime-types (list of MIME types as string values)
	 *  - max-size (size as string with unit)
	 *  - path (string)
	 *
	 * @returns storage configuration parameters
	 */
	getStorageConfiguration() {
		return config.get("domino.storage");
	}

	/**
	 * Returns registrations file path.
	 *
	 * @returns registrations file path
	 */
	getRegistrationsFilePath() {
		return config.get("domino.system.registrations-path");
	}

	/**
	 * Returns application start-up timeout value in ms.
	 *
	 * @returns application start-up timeout value in ms
	 */
	getStartTimeout() {
		return config.get("domino.system.spawn-control.start-timeout");
	}

	/**
	 * Returns the name of the selected service handler.
	 *
	 * @returns the name of the selected service handler
	 */
	getServiceHandler() {
		return config.get("domino.system.spawn-control.service-handler");
	}

	/**
	 * Returns the security configuration parameters:
	 *  - expiration
	 *  - jwt-private-key
	 *  - username
	 *  - password
	 *  - allowed-sources (list)
	 *
	 * @returns the security configuration parameters
	 */
	getSecurityConfig() {
		return config.get("domino.auth");
	}

	/**
	 * Returns the active authorization mode.
	 *
	 * @return {AuthorizationMode}
	 */
	getAuthorizationMode() {

		let authorizationMode = AuthorizationMode.DIRECT;
		if (config.has("domino.auth.auth-mode")) {
			authorizationMode = Object.values(AuthorizationMode)
				.find(value => value === config.get("domino.auth.auth-mode").toLowerCase()) || AuthorizationMode.DIRECT;
		}

		return authorizationMode;
	}

	/**
	 * Returns the Docker configuration parameters:
	 *  - Docker Engine API socket path
	 *  - list of private Docker Registry server configurations as host, username and password parameters
	 *
	 * @returns the Docker configuration parameters
	 */
	getDockerConfig() {
		return config.get("domino.docker");
	}
}
