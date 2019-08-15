import logManager from "../../../domino_main";

const logger = logManager.createLogger("DeploymentService");

/**
 * Service for deployment handling operations.
 */
export default class DeploymentService {

	constructor() {

	}

	/**
	 * Starts deploying the given version of the given app.
	 *
	 * @param app application to be deployed
	 * @param version version of the application to be deployed
	 */
	deploy(app, version) {
		logger.warn("Not implemented");
	}
}