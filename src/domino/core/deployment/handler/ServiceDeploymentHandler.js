import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed via an OS-specific service executor, such as systemd or init.d service descriptors.
 */
export default class ServiceDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry, serviceAdapterRegistry) {
		super(filenameUtility, executorUserRegistry);
		this._serviceAdapter = serviceAdapterRegistry.getServiceAdapter();
	}

	/**
	 * Starts the application by calling its service name with the start command.
	 *
	 * @param registration AppRegistration object containing information about the application to be started
	 */
	start(registration) {
		this._serviceAdapter.start(registration.execution.commandName);
	}

	/**
	 * Stops the application by calling its service name with the stop command.
	 *
	 * @param registration AppRegistration object containing information about the application to be stopped
	 */
	stop(registration) {
		this._serviceAdapter.stop(registration.execution.commandName);
	}

	/**
	 * Restarts the application by calling its service name with the restart command.
	 *
	 * @param registration AppRegistration object containing information about the application to be restarted
	 */
	restart(registration) {
		this._serviceAdapter.restart(registration.execution.commandName);
	}
}
