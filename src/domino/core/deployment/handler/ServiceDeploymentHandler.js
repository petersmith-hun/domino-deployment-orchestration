import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed via an OS-specific service executor, such as systemd or init.d service descriptors.
 */
export default class ServiceDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility) {
		super(filenameUtility);
	}

}
