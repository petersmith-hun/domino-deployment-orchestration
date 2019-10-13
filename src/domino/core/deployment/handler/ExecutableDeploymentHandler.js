import path from "path";
import AbstractSpawningDeploymentHandler from "./AbstractSpawningDeploymentHandler";

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed by directly calling their executable binary.
 */
export default class ExecutableDeploymentHandler extends AbstractSpawningDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry, executableBinaryHandler) {
		super(filenameUtility, executorUserRegistry, executableBinaryHandler);
	}

	_prepareSpawnParameters(registration) {

		return {
			executablePath: path.join(registration.source.home, registration.source.resource),
			args: registration.execution.args,
			userID: this._executorUserRegistry.getUserID(registration),
			workDirectory: registration.source.home
		};
	}
}
