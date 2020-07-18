import ExecutableVersion from "../domain/ExecutableVersion";

const _LATEST_VERSION = new ExecutableVersion("latest");
const _DOCKER_SOURCE_TYPE = "DOCKER";

/**
 * Adapter implementation to decide how a deployment request for the "latest" version of a registration should be handled.
 */
export default class LatestVersionAdapter {

	constructor(appRegistrationRegistry, executableVersionUtility) {
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._executableVersionUtility = executableVersionUtility;
	}

	/**
	 * Determines the latest version of the given application.
	 *
	 * In case the given registration is Docker-based, latest ExecutableVersion instance is immediately returned,
	 * as in this case latest version should be determined by Docker Engine itself.
	 *
	 * Otherwise the registration is handled as a filesystem-based one, and the call is passed forward to
	 * ExecutableVersionUtility, so it can determine the latest version by looking it up in Domino's storage.
	 *
	 * @param app registration name
	 * @returns {string} the determined latest version
	 */
	determineLatestVersion(app) {

		const registration = this._appRegistrationRegistry.getRegistration(app);

		return this._isDockerApp(registration)
			? _LATEST_VERSION
			: this._executableVersionUtility.findLatestVersion(app);
	}

	_isDockerApp(registration) {
		return registration.source.type === _DOCKER_SOURCE_TYPE;
	}
}
