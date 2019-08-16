import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

export default class ServiceDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility) {
		super(filenameUtility);
	}

	// TODO init step for initializing service descriptor?
}