import config from "config";

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
		return config.get("domino.registrations-path");
	}

	/**
	 * Returns application start-up timeout value in ms.
	 *
	 * @returns application start-up timeout value in ms
	 */
	getStartTimeout() {
		return config.get("domino.start-timeout");
	}

	/**
	 * Returns the name of the selected service handler.
	 *
	 * @returns the name of the selected service handler
	 */
	getServiceHandler() {
		return config.get("domino.service-handler");
	}

	/**
	 * Returns the security configuration parameters:
	 *  - expiration
	 *  - jwt-private-key
	 *  - username
	 *  - password
	 *
	 * @returns the security configuration parameters
	 */
	getSecurityConfig() {
		return config.get("domino.auth");
	}
}
