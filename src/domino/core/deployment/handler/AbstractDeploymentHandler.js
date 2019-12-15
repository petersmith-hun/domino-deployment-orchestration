import LoggerFactory from "../../../helper/LoggerFactory";
import {DeploymentStatus} from "../../domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("AbstractDeploymentHandler");
const _RESTARTABLE_STATUSES = [DeploymentStatus.STOPPED, DeploymentStatus.UNKNOWN_STOPPED];

/**
 * Base (abstract) deployment handler component (every method throws Error, so they must be overridden).
 * Implementations should handle the deployment lifecycle of an application accordingly to how they should be treated based on the registration information.
 */
export default class AbstractDeploymentHandler {

	constructor(configurationProvider) {
		this._startTimeout = configurationProvider.getStartTimeout();
	}

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
	async start(registration) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Stops the application specified by the passed registration object.
	 *
	 * @param registration AppRegistration object containing information about the application to be stopped
	 */
	async stop(registration) {
		throw new Error("Not implemented operation");
	}

	/**
	 * Restarts the application specified by the passed registration object.
	 * As for the default behavior, restart calls stop and the start methods.
	 *
	 * @param registration AppRegistration object containing information about the application to be restarted
	 */
	async restart(registration) {

		logger.info(`Waiting for the application=${registration.appName} to stop...`);
		let stopStatus = await this.stop(registration);
		if (_RESTARTABLE_STATUSES.includes(stopStatus)) {
			logger.info(`Application=${registration.appName} stopped. Waiting ${this._startTimeout} ms to restart`);
			stopStatus = await new Promise(resolve => setTimeout(async () => resolve(await this.start(registration)), this._startTimeout));
		}

		return stopStatus;
	}
}
