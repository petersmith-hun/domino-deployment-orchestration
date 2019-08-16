import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

export default class ExecutableDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility) {
		super(filenameUtility);
	}
}