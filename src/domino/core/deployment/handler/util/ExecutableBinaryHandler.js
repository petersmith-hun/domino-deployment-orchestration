import * as proc from "child_process";
import logManager from "../../../../../domino_main";
import {snapshot} from "process-list";

const logger = logManager.createLogger('ExecutableBinaryHandler');

/**
 * Utility class for tools handling executable binaries.
 * Implementation wraps 'child_process' and 'process' commands.
 */
export default class ExecutableBinaryHandler {

	/**
	 * Creates a detached process with the given parameters.
	 *
	 * Expects the following parameters (wrapped as a single object):
	 *  - executablePath: absolute path of the executable
	 *  - args: command line arguments
	 *  - userID: executor user's ID (as registered in the OS)
	 *  - workDirectory: absolute path for the home directory of the binary
	 *
	 * @param spawnParameters wrapper object for the parameters described above
	 * @returns {ChildProcessWithoutNullStreams} process object
	 */
	spawnProcess(spawnParameters) {

		return proc.spawn(spawnParameters.executablePath, spawnParameters.args, {
			uid: spawnParameters.userID,
			cwd: spawnParameters.workDirectory,
			detached: true
		});
	}

	/**
	 * Kills a running process (with its child processes) by its PID.
	 *
	 * PID (wrapped in a process object) of processes spawned by Domino should be registered in the application.
	 * Otherwise the process can be looked up by its registered resource.
	 *
	 * @param runningProcess process object (nullable)
	 * @param registration AppRegistration object, with which the process can be looked up if PID is missing
	 */
	killProcess(runningProcess, registration) {

		if (runningProcess) {
			this._killProcessGroup(runningProcess.pid);
		} else {
			logger.warn(`PID not available for ${registration.appName}, looking up running process...`);

			this._findProcess(registration).then(foundProcess => {
				if (foundProcess) {
					logger.info(`Found PID=${foundProcess.pid} for cmdline='${foundProcess.cmdline}'`);
					this._killProcessGroup(foundProcess.pid);
				} else {
					logger.warn(`Failed to stop process for appName=${registration.appName} - might be a first-time execution?`);
				}
			});
		}
	}

	_findProcess(registration) {

		const snapshotPromise = snapshot('pid', 'cmdline');

		return (async () => {
			const processList = await snapshotPromise;
			return processList.find(item => item.cmdline.includes(registration.source.resource));
		})();
	}

	_killProcessGroup(parentPID) {
		process.kill(-parentPID);
		logger.info(`Kill signal sent to the process group of PID=${parentPID}`);
	}
}
