/**
 * Abstract base class for OS service calls.
 * Implementations should handle a specific kind of service executor based on the used OS.
 */
export default class AbstractServiceAdapter {

	/**
	 * Starts the service.
	 *
	 * @param serviceName name of the service to be started
	 */
	start(serviceName) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Stops the service.
	 *
	 * @param serviceName name of the service to be stopped
	 */
	stop(serviceName) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Restarts the service.
	 *
	 * @param serviceName name of the service to be restarted
	 */
	restart(serviceName) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Defines the names of the service handler which the implementation is compatible with.
	 *
	 * @return {string} the compatible service handler name
	 */
	serviceHandlerCompatibility() {
		throw new Error("Not implemented operation");
	}
}