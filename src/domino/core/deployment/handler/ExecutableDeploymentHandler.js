import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed by directly calling their executable binary.
 */
export default class ExecutableDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility) {
		super(filenameUtility);
	}
}
