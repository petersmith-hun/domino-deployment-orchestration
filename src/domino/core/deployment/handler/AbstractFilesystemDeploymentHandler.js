import AbstractDeploymentHandler from "./AbstractDeploymentHandler";
import config from "config";
import fs from "fs";
import path from "path";
import logManager from "../../../../domino_main";

const logger = logManager.createLogger("AbstractFilesystemDeploymentHandler");

/**
 * Common (abstract) AbstractDeploymentHandler implementation that handles deployment phase of an application for
 * application handled directly with shell commands (eg. FILESYSTEM source typed applications).
 */
export default class AbstractFilesystemDeploymentHandler extends AbstractDeploymentHandler{

	constructor(filenameUtility) {
		super();
		this._filenameUtility = filenameUtility;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Deploys the application by copying the uploaded executable from its temporary storage to its working directory.
	 *
	 * @param registration AppRegistration object containing information about the application to be deployed
	 * @param version version of the application to be deployed
	 */
	deploy(registration, version) {

		const storedFilename = this._filenameUtility.createFilename({
			originalname: registration.source.resource,
			app: registration.appName,
			version: version});
		const source = path.join(this._storageConfig.path, storedFilename);
		const target = path.join(registration.source.home, registration.source.resource);

		try {
			fs.copyFileSync(source, target);
			logger.info(`Successfully deployed app=${registration.appName} from=${source} to=${target}`);
		} catch (e) {
			logger.error(`Failed to deploy app=${registration.appName} from=${source} to=${target}, reason=${e.message}`)
		}
	}
}