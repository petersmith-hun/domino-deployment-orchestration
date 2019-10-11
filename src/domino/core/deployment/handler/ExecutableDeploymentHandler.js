import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";
import logManager from "../../../../domino_main";
import path from "path";

const logger = logManager.createLogger("ExecutableDeploymentHandler");

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed by directly calling their executable binary.
 */
export default class ExecutableDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry, executableBinaryHandler) {
		super(filenameUtility, executorUserRegistry);
		this._executableBinaryHandler = executableBinaryHandler;
		this._processes = [];
	}

	/**
	 * Starts the application by calling its executable.
	 *
	 * @param registration AppRegistration object containing information about the application to be started
	 */
	start(registration) {

		logger.info(`Starting application=${registration.appName}...`);

		this._processes[registration.appName] = this._executableBinaryHandler.spawnProcess({
			executablePath: path.join(registration.source.home, registration.source.resource),
			args: registration.execution.args,
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
}
