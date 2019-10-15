import path from "path";
import AbstractSpawningDeploymentHandler from "./AbstractSpawningDeploymentHandler";

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed via their specified runtime executor, such as JVM.
 */
export default class RuntimeDeploymentHandler extends AbstractSpawningDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry, executableBinaryHandler, appRegistrationRegistry) {
		super(filenameUtility, executorUserRegistry, executableBinaryHandler);
		this._appRegistrationRegistry = appRegistrationRegistry;
	}

	_prepareSpawnParameters(registration) {

		const runtime = this._getRuntime(registration);
		return {
			executablePath: runtime.binary,
			args: this._prepareArgs(registration, runtime),
			userID: this._executorUserRegistry.getUserID(registration),
			workDirectory: registration.source.home
		};
	}

	_getRuntime(registration) {

		if (!registration.runtime) {
			throw Error(`Runtime is not specified for runtime-execution app by appName=${registration.appName}`);
		}

		return this._appRegistrationRegistry.getRuntime(registration.runtime);
	}

	_prepareArgs(registration, runtime) {

		let argsArray = Array.isArray(registration.execution.args)
			? Array.from(registration.execution.args)
			: Array.of(registration.execution.args);

		argsArray.push(runtime.resourceMarker);
		argsArray.push(this._prepareResource(registration));

		return argsArray;
	}

	_prepareResource(registration) {
		return path.join(registration.source.home, registration.source.resource);
	}
}
