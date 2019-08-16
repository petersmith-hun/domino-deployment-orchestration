import logManager from "../../../domino_main";

const logger = logManager.createLogger("DeploymentService");

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
		this._deploymentHandlerRegistry.deploy(registration, version);
	}

	start(app) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry.start(registration);
	}

	stop(app) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry.stop(registration);
	}

	restart(app) {
		let registration = this._getRegistration(app);
		this._deploymentHandlerRegistry.restart(registration);
	}

	_getRegistration(app) {
		return this._appRegistrationRegistry.getRegistration(app);
	}
}