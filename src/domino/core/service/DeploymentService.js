/**
 * Service for deployment handling operations.
 */
export default class DeploymentService {

	constructor(appRegistrationRegistry, deploymentHandlerRegistry) {
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._deploymentHandlerRegistry = deploymentHandlerRegistry;
	}

	/**
	 * Starts deploying the given version of the given app.
	 *
	 * @param app application to be deployed
	 * @param version version of the application to be deployed
	 */
	deploy(app, version) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry
			.getHandler(registration)
			.deploy(registration, version);
	}

	/**
	 * Starts the currently deployed version of the application.
	 *
	 * @param app application to be started
	 */
	start(app) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry
			.getHandler(registration)
			.start(registration);
	}

	/**
	 * Stops the currently running instance of the application.
	 *
	 * @param app application to be stopped
	 */
	stop(app) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry
			.getHandler(registration)
			.stop(registration);
	}

	/**
	 * Restarts the currently running instance of the application.
	 *
	 * @param app application to be restarted
	 */
	restart(app) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry
			.getHandler(registration)
			.restart(registration);
	}

	_getRegistration(app) {
		return this._appRegistrationRegistry.getRegistration(app);
	}
}