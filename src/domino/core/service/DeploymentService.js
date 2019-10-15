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
		this._executeOperation(app, (handler, registration) => handler.deploy(registration, version));
	}

	/**
	 * Starts the currently deployed version of the application.
	 *
	 * @param app application to be started
	 */
	start(app) {
		this._executeOperation(app, (handler, registration) => handler.start(registration));
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
	restart(app) {
		this._executeOperation(app, (handler, registration) => handler.restart(registration));
	}

	_executeOperation(app, operation) {

		const registration = this._getRegistration(app);
		const handler = this._deploymentHandlerRegistry
			.getHandler(registration);

		operation(handler, registration);
	}

	_getRegistration(app) {
		return this._appRegistrationRegistry.getRegistration(app);
	}
}