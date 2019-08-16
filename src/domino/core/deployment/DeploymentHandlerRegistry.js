import UnsupportedDeploymentMode from "../error/UnsupportedDeploymentMode";

export default class DeploymentHandlerRegistry {

	constructor(executableDeploymentHandler, runtimeDeploymentHandler, serviceDeploymentHandler) {
		this._registry = {
			filesystem: {
				executable: executableDeploymentHandler,
				runtime: runtimeDeploymentHandler,
				service: serviceDeploymentHandler
			}
		}
	}

	deploy(registration, version) {
		this._getHandler(registration).deploy(registration, version);
	}

	start(registration) {
		this._getHandler(registration).start(registration);
	}

	stop(registration) {
		this._getHandler(registration).stop(registration);
	}

	restart(registration) {
		this._getHandler(registration).restart(registration);
	}

	_getHandler(registration) {

		try {
			return this._registry[registration.source.type.toLowerCase()][registration.execution.executionHandler.toLowerCase()];
		} catch (e) {
			throw new UnsupportedDeploymentMode(registration);
		}
	}
}