import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";
import logManager from "../../../../domino_main";

const logger = logManager.createLogger("AbstractSpawningDeploymentHandler");

/**
 * Common (abstract) AbstractFilesystemDeploymentHandler implementation for deployment handlers using spawn operation to start processes.
 *
 * Started processes are unreferenced right after starting them so stopping Domino would not stop the spawned processes.
 * However these deployment handlers should store the reference to the spawned processes (done in this class), so they can stop them on request.
 */
export default class AbstractSpawningDeploymentHandler extends AbstractFilesystemDeploymentHandler{

	constructor(filenameUtility, executorUserRegistry, executableBinaryHandler) {
		super(filenameUtility, executorUserRegistry);
		this._executableBinaryHandler = executableBinaryHandler;
		this._processes = [];
	}

	/**
	 * Orchestrates spawning a process by the provided spawn parameters.
	 * After spawning the processes, they are unref'd.
	 *
	 * @param registration AppRegistration object containing application information
	 */
	start(registration) {

		logger.info(`Starting application=${registration.appName}...`);

		try {
			const spawnParameters = this._prepareSpawnParameters(registration);
			this._processes[registration.appName] = this._executableBinaryHandler.spawnProcess(spawnParameters);

			logger.info(`Started application=${registration.appName} with PID=${this._processes[registration.appName].pid}`);
			this._processes[registration.appName].unref();
		} catch (e) {
			logger.error(`Failed to spawn process for application=${registration.appName} - reason='${e.message}'`);
		}
	}

	/**
	 * Orchestrates stopping a previously spawned process.
	 *
	 * @param registration AppRegistration object containing application information
	 */
	stop(registration) {

		logger.info(`Stopping application=${registration.appName}...`);
		this._executableBinaryHandler.killProcess(this._processes[registration.appName], registration);
	}

	/**
	 * Implementation should return the proper spawn parameters.
	 *
	 * @see ExecutableBinaryHandler's documentation for the required spawn parameters
	 * @param registration AppRegistration object containing application information
	 * @private should only be accessed by the implementing classes
	 */
	_prepareSpawnParameters(registration) {
		throw Error("Not implemented operation");
	}
}