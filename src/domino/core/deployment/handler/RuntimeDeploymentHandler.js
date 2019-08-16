import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

export default class RuntimeDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility) {
		super(filenameUtility);
	}
}