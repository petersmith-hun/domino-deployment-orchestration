import BaseController from "./BaseController";
import LoggerFactory from "../../helper/LoggerFactory";
import {DeploymentStatus} from "../../core/domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("UploadController");

/**
 * Controller implementation to handler executable binary uploads.
 */
export default class UploadController extends BaseController {

	constructor(deploymentService) {
		super("upload");
		this._deploymentService = deploymentService;
	}

	/**
	 * POST /upload/:app/:version
	 * Handles executable upload.
	 * Requires the following path parameters:
	 *  - app: name of a (registered) application
	 *  - version: version of the executable being uploaded
	 * Optional query parameter:
	 *  - autodeploy: if set to true, deployment commences immediately right after the upload finishes
	 *  - autostart: if set to true, application is started after a successful deploy
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	async uploadExecutable(req, resp) {

		const app = req.params.app;
		const version = req.params.version;
		logger.info(`File with originalName=${req.file.originalname} has been uploaded for app=${app} with version=${version}`);

		let uploadStatus;
		if (req.query.autodeploy) {
			uploadStatus = (await this._deploymentService.deploy(app, version)).status;

			if (uploadStatus === DeploymentStatus.DEPLOYED && req.query.autostart) {
				uploadStatus = await this._deploymentService.restart(app);
			}
		} else {
			uploadStatus = DeploymentStatus.UPLOADED
		}

		resp.status(this.mapDeploymentStatusToStatusCode(uploadStatus))
			.send({
				message: `Uploaded in ${this.getProcessingTime(req)} ms`,
				status: uploadStatus,
				version: version
			});
	}
}