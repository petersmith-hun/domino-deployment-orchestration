import ExecutableVersion from "../domain/ExecutableVersion";
import LoggerFactory from "../../helper/LoggerFactory";
import {DeploymentStatus} from "../domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("DeploymentService");

/**
 * Service for deployment handling operations.
 */
export default class DeploymentService {

	constructor(appRegistrationRegistry, deploymentHandlerRegistry, latestVersionAdapter, healthCheckProvider, infoProvider) {
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._deploymentHandlerRegistry = deploymentHandlerRegistry;
		this._latestVersionAdapter = latestVersionAdapter;
		this._healthCheckProvider = healthCheckProvider;
		this._infoProvider = infoProvider;
	}

	/**
	 * Retrieves information of the given application.
	 *
	 * @param app application of which info endpoint is requested
	 */
	async getInfo(app) {
		return await this._infoProvider.getAppInfo(this._getRegistration(app));
	}

	/**
	 * Starts deploying the latest version of the given app.
	 *
	 * @param app application to be deployed
	 */
	async deployLatest(app) {

		const latestVersion = this._latestVersionAdapter.determineLatestVersion(app);
		let deploymentResult;

		if (latestVersion) {
			deploymentResult = await this.deploy(app, latestVersion);
		} else {
			logger.warn(`No appropriate version of app=${app} could be found - rejecting deployment`);
			deploymentResult = Promise.resolve({
				status: DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION,
				version: "latest"
			});
		}

		return deploymentResult;
	}

	/**
	 * Starts deploying the given version of the given app.
	 *
	 * @param app application to be deployed
	 * @param version version of the application to be deployed
	 */
	async deploy(app, version) {

		const parsedVersion = version instanceof ExecutableVersion
			? version
			: new ExecutableVersion(version);

		return this._executeOperation(app, async (handler, registration) => await handler.deploy(registration, parsedVersion));
	}

	/**
	 * Starts the currently deployed version of the application.
	 *
	 * @param app application to be started
	 */
	async start(app) {
		return this._executeOperation(app, async (handler, registration) => {
			return await this._conditionallyExecuteHealthCheck(registration, await handler.start(registration));
		});
	}

	/**
	 * Stops the currently running instance of the application.
	 *
	 * @param app application to be stopped
	 */
	async stop(app) {
		return await this._executeOperation(app, async (handler, registration) => await handler.stop(registration));
	}

	/**
	 * Restarts the currently running instance of the application.
	 *
	 * @param app application to be restarted
	 */
	async restart(app) {
		return this._executeOperation(app, async (handler, registration) => {
			return await this._conditionallyExecuteHealthCheck(registration, await handler.restart(registration));
		});
	}

	async _executeOperation(app, operation) {

		const registration = this._getRegistration(app);
		const handler = this._deploymentHandlerRegistry
			.getHandler(registration);

		return operation(handler, registration);
	}

	_getRegistration(app) {
		return this._appRegistrationRegistry.getRegistration(app);
	}

	async _conditionallyExecuteHealthCheck(registration, startStatus) {

		if (startStatus === DeploymentStatus.UNKNOWN_STARTED) {
			startStatus = await this._healthCheckProvider.executeHealthCheck(registration);
		}

		return startStatus;
	}
}