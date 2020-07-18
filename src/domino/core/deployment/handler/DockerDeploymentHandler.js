import AbstractDeploymentHandler from "./AbstractDeploymentHandler";
import {DockerCommand} from "../../domain/DockerRequest";
import LoggerFactory from "../../../helper/LoggerFactory";
import {DeploymentStatus} from "../../domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("DockerDeploymentHandler");

/**
 * AbstractDeploymentHandler implementation handling Docker-based deployments.
 * Supports standard (pull, run and basic lifecycle commands) Docker operations.
 */
export default class DockerDeploymentHandler extends AbstractDeploymentHandler {

	constructor(configurationProvider, dockerSocketClient, dockerRequestFactory) {
		super(configurationProvider);
		this._dockerSocketClient = dockerSocketClient;
		this._dockerRequestFactory = dockerRequestFactory;

		this._dockerSocketClient.identifyDocker();
	}

	/**
	 * Deploys a Docker container by pulling the specified version (tag) of the configured image, stopping
	 * and removing the old instance and creating a container based on the specified registration config.
	 *
	 * To start the container, start command must be called explicitly.
	 *
	 * @param registration AppRegistration object containing information about the application to be deployed
	 * @param version version of the application to be deployed
	 * @returns DeploymentStatus and version wrapped as Promise
	 */
	async deploy(registration, version) {

		const imageName = this._prepareImageName(registration);
		const tag = version.getRawVersion();
		const dockerPullRequest = this._dockerRequestFactory.createDockerPullRequest(imageName, tag, registration);

		const pullSucceeded = this._isCallSuccessful(await this._dockerSocketClient.executeDockerCommand(dockerPullRequest));

		let deploymentSuccessful = false;
		if (pullSucceeded) {
			if (!await this._executeLifecycleCommand(registration, DockerCommand.REMOVE)) {
				logger.warn(`Failed to stop running container for app=${registration.appName} - maybe a first time execution?`);
			}
			const dockerCreateRequest = this._dockerRequestFactory.createDockerContainerCreationRequest(imageName, tag, registration);
			deploymentSuccessful = this._isCallSuccessful(await this._dockerSocketClient.executeDockerCommand(dockerCreateRequest));

			if (!deploymentSuccessful) {
				logger.error(`Failed to create container for app=${registration.appName} from=${imageName}:${tag}`);
			}
		} else {
			logger.error(`Failed to deploy app=${registration.appName} from=${imageName}:${tag}`);
		}

		return Promise.resolve({
			status: deploymentSuccessful
				? DeploymentStatus.DEPLOYED
				: DeploymentStatus.DEPLOY_FAILED_UNKNOWN,
			version: tag
		});
	}

	/**
	 * Starts the Docker container specified by the registration by calling 'docker start <command-name>'.
	 *
	 * @param registration AppRegistration object containing application information
	 * @returns result of the operation as DeploymentStatus wrapped as Promise
	 */
	async start(registration) {
		return await this._executeLifecycleCommand(registration, DockerCommand.START)
			? DeploymentStatus.UNKNOWN_STARTED
			: DeploymentStatus.START_FAILURE;
	}

	/**
	 * Stops the Docker container specified by the registration by calling 'docker stop <command-name>'.
	 *
	 * @param registration AppRegistration object containing application information
	 * @returns result of the operation as DeploymentStatus wrapped as Promise
	 */
	async stop(registration) {
		return await this._executeLifecycleCommand(registration, DockerCommand.STOP)
			? DeploymentStatus.UNKNOWN_STOPPED
			: DeploymentStatus.STOP_FAILURE;
	}

	/**
	 * Restarts the Docker container specified by the registration by calling 'docker restart <command-name>'.
	 *
	 * @param registration AppRegistration object containing application information
	 * @returns result of the operation as DeploymentStatus wrapped as Promise
	 */
	async restart(registration) {
		return await this._executeLifecycleCommand(registration, DockerCommand.RESTART)
			? DeploymentStatus.UNKNOWN_STARTED
			: DeploymentStatus.START_FAILURE;
	}

	_prepareImageName(registration) {

		return registration.source.home && registration.source.home.length > 0
			? `${registration.source.home}/${registration.source.resource}`
			: `${registration.source.resource}`;
	}

	async _executeLifecycleCommand(registration, dockerCommand) {

		const dockerRequest = this._dockerRequestFactory.createDockerLifecycleCommand(registration, dockerCommand);

		return this._isCallSuccessful(await this._dockerSocketClient.executeDockerCommand(dockerRequest));
	}

	_isCallSuccessful(dockerEngineResponse) {
		return dockerEngineResponse.statusCode >= 200
			&& dockerEngineResponse.statusCode < 300;
	}
}
