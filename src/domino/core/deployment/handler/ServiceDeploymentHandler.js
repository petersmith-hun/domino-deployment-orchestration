import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";
import LoggerFactory from "../../../helper/LoggerFactory";
import {DeploymentStatus} from "../../domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("ServiceDeploymentHandler");

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed via an OS-specific service executor, such as systemd or init.d service descriptors.
 */
export default class ServiceDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry, serviceAdapterRegistry, configurationProvider) {
		super(filenameUtility, executorUserRegistry, configurationProvider);
		this._serviceAdapter = serviceAdapterRegistry.getServiceAdapter();
	}

	/**
	 * Starts the application by calling its service name with the start command.
	 *
	 * @param registration AppRegistration object containing information about the application to be started
	 */
	async start(registration) {
		logger.info(`Starting application=${registration.appName} by OS service...`);
		this._serviceAdapter.start(registration.execution.commandName);
		logger.info(`Started application=${registration.appName}`);

		return Promise.resolve(DeploymentStatus.UNKNOWN_STARTED);
	}

	/**
	 * Stops the application by calling its service name with the stop command.
	 *
	 * @param registration AppRegistration object containing information about the application to be stopped
	 */
	async stop(registration) {
		logger.info(`Stopping application=${registration.appName} by OS service...`);
		this._serviceAdapter.stop(registration.execution.commandName);
		logger.info(`Stopped application=${registration.appName}`);

		return Promise.resolve(DeploymentStatus.STOPPED);
	}

	/**
	 * Restarts the application by calling its service name with the restart command.
	 *
	 * @param registration AppRegistration object containing information about the application to be restarted
	 */
	async restart(registration) {
		logger.info(`Restarting application=${registration.appName} by OS service...`);
		this._serviceAdapter.restart(registration.execution.commandName);
		logger.info(`Restarted application=${registration.appName}`);

		return Promise.resolve(DeploymentStatus.UNKNOWN_STARTED);
	}
}
