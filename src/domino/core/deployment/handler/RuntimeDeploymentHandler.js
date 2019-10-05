import AbstractFilesystemDeploymentHandler from "./AbstractFilesystemDeploymentHandler";

/**
 * AbstractFilesystemDeploymentHandler implementation that handles deployment lifecycle of applications
 * executed via their specified runtime executor, such as JVM.
 */
export default class RuntimeDeploymentHandler extends AbstractFilesystemDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry) {
		super(filenameUtility, executorUserRegistry);
	}
}
