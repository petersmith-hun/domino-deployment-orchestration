/**
 * Base (abstract) deployment handler component (every method throws Error, so they must be overridden).
 * Implementations should handle the deployment lifecycle of an application accordingly to how they should be treated based on the registration information.
 */
export default class AbstractDeploymentHandler {

	/**
	 * Deploys the application specified by the passed registration object with the given version.
	 *
	 * @param registration AppRegistration object containing information about the application to be deployed
	 * @param version version of the application to be deployed
	 */
	deploy(registration, version) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Starts the application specified by the passed registration object.
	 *
	 * @param registration AppRegistration object containing information about the application to be started
	 */
	start(registration) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Stops the application specified by the passed registration object.
	 *
	 * @param registration AppRegistration object containing information about the application to be stopped
	 */
	stop(registration) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Restarts the application specified by the passed registration object.
	 * As for the default behavior, restart calls stop and the start methods.
	 *
	 * @param registration AppRegistration object containing information about the application to be restarted
	 */
	restart(registration) {
		this.stop(registration);
		this.start(registration);
	}
}
