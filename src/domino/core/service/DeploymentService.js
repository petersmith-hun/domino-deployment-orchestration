import ExecutableVersion from "../domain/ExecutableVersion";
import LoggerFactory from "../../helper/LoggerFactory";

const logger = LoggerFactory.createLogger("DeploymentService");

/**
 * Service for deployment handling operations.
 */
export default class DeploymentService {

	constructor(appRegistrationRegistry, deploymentHandlerRegistry, executableVersionUtility, healthCheckProvider) {
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._deploymentHandlerRegistry = deploymentHandlerRegistry;
		this._executableVersionUtility = executableVersionUtility;
		this._healthCheckProvider = healthCheckProvider;
	}

	/**
	 * Starts deploying the latest version of the given app.
	 *
	 * @param app application to be deployed
	 */
	deployLatest(app) {
		const latestVersion = this._executableVersionUtility.findLatestVersion(app);
		if (latestVersion) {
			this.deploy(app, latestVersion);
		} else {
			logger.warn(`No appropriate version of app=${app} could be found - rejecting deployment`);
		}

		return latestVersion;
	}

	/**
	 * Starts deploying the given version of the given app.
	 *
	 * @param app application to be deployed
	 * @param version version of the application to be deployed
	 */
	deploy(app, version) {

		const parsedVersion = version instanceof ExecutableVersion
			? version
			: new ExecutableVersion(version);

		this._executeOperation(app, (handler, registration) => handler.deploy(registration, parsedVersion));
	}

	/**
	 * Starts the currently deployed version of the application.
	 *
	 * @param app application to be started
	 */
	start(app) {
		this._executeOperation(app, (handler, registration) => {
			handler.start(registration);
			this._healthCheckProvider.executeHealthCheck(registration);
		});
	}

	/**
	 * Stops the currently running instance of the application.
	 *
	 * @param app application to be stopped
	 */
	stop(app) {
		this._executeOperation(app, (handler, registration) => handler.stop(registration));
	}

	/**
	 * Restarts the currently running instance of the application.
	 *
	 * @param app application to be restarted
	 */
	async restart(app) {
		return this._executeOperation(app, async (handler, registration) => {
			await handler.restart(registration);
			return await this._healthCheckProvider.executeHealthCheck(registration)
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
}