import UnsupportedDeploymentMode from "../error/UnsupportedDeploymentMode";

/**
 * Registry component holding information about the registered (available) deployment handlers.
 */
export default class DeploymentHandlerRegistry {

	constructor(executableDeploymentHandler, runtimeDeploymentHandler, serviceDeploymentHandler) {
		this._registry = {
			filesystem: {
				executable: executableDeploymentHandler,
				runtime: runtimeDeploymentHandler,
				service: serviceDeploymentHandler
			}
		}
	}

	/**
	 * Retrieves deployment handler component for the given registration.
	 * Throws exception in case of requesting a non-supported deployment mode.
	 *
	 * @param registration application registration object as AppRegistration
	 * @returns supported deployment handler instance or exception
	 */
	getHandler(registration) {

		const sourceType = registration.source.type.toLowerCase();
		const executionMode = registration.execution.executionHandler.toLowerCase();

		try {
			return this._registry[sourceType][executionMode];
		} catch (e) {
			throw new UnsupportedDeploymentMode(registration);
		}
	}
}
