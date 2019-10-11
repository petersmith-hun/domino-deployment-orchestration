import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";
import path from "path";
import logManager from "../../../../domino_main";

const logger = logManager.createLogger('RuntimeDeploymentHandler');

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed via their specified runtime executor, such as JVM.
 */
export default class RuntimeDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry, executableBinaryHandler, appRegistrationRegistry) {
		super(filenameUtility, executorUserRegistry);
		this._executableBinaryHandler = executableBinaryHandler;
		this._appRegistrationRegistry = appRegistrationRegistry;
		this._processes = [];
	}

	/**
	 * Starts application by executing it via its specified runtime executor.
	 *
	 * @param registration AppRegistration object containing information about the application to be started
	 */
	start(registration) {

		logger.info(`Starting application=${registration.appName}...`);

		const runtime = this._getRuntime(registration);
		this._processes[registration.appName] = this._executableBinaryHandler.spawnProcess({
			executablePath: runtime.binary,
			args: this._prepareArgs(registration, runtime),
			userID: this._executorUserRegistry.getUserID(registration),
			workDirectory: registration.source.home
		});

		logger.info(`Started application=${registration.appName} with PID=${this._processes[registration.appName].pid}`);
	}

	/**
	 * Stops the application by looking up its process and sending it a kill signal.
	 *
	 * @param registration AppRegistration object containing information about the application to be stopped
	 */
	stop(registration) {

		logger.info(`Stopping application=${registration.appName}...`);
		this._executableBinaryHandler.killProcess(this._processes[registration.appName], registration);
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
