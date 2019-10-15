import AbstractDeploymentHandler from "./AbstractDeploymentHandler";
import config from "config";
import fs from "fs";
import path from "path";
import logManager from "../../../../domino_main";

const logger = logManager.createLogger("AbstractFilesystemDeploymentHandler");

const DEFAULT_EXECUTION_PERMISSION = 0o774;

/**
 * Common (abstract) AbstractDeploymentHandler implementation that handles deployment phase of an application for
 * application handled directly with shell commands (eg. FILESYSTEM source typed applications).
 */
export default class AbstractFilesystemDeploymentHandler extends AbstractDeploymentHandler {

	constructor(filenameUtility, executorUserRegistry) {
		super();
		this._filenameUtility = filenameUtility;
		this._executorUserRegistry = executorUserRegistry;
		this._storageConfig = config.get("domino.storage");
	}

	/**
	 * Deploys the application by copying the uploaded executable from its temporary storage to its working directory.
	 *
	 * @param registration AppRegistration object containing information about the application to be deployed
	 * @param version version of the application to be deployed
	 */
	deploy(registration, version) {

		logger.info(`Deploying app=${registration.appName} with version=${version}...`);

		const storedFilename = this._prepareStoredFilename(registration, version);
		const source = this._prepareSourcePath(storedFilename);
		const target = this._prepareTargetPath(registration);

		try {
			const userID = this._executorUserRegistry.getUserID(registration);
			fs.copyFileSync(source, target);
			fs.chmodSync(target, DEFAULT_EXECUTION_PERMISSION);
			fs.chownSync(target, userID, userID);
			logger.info(`Successfully deployed app=${registration.appName} from=${source} to=${target}`);
		} catch (e) {
			logger.error(`Failed to deploy app=${registration.appName} from=${source} to=${target}, reason=${e.message}`)
		}
	}
	_prepareStoredFilename(registration, version) {
		return this._filenameUtility.createFilename({
			originalname: registration.source.resource,
			app: registration.appName,
			version: version
		});
	}

	_prepareSourcePath(storedFilename) {
		return path.join(this._storageConfig.path, storedFilename);
	}

	_prepareTargetPath(registration) {
		return path.join(registration.source.home, registration.source.resource);
	}
}