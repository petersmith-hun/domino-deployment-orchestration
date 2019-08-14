import logManager from "../../../domino_main";
import BaseController, {HTTP_STATUS_CREATED} from "./BaseController";

const logger = logManager.createLogger("UploadController");

/**
 * Controller implementation to handler executable binary uploads.
 */
export default class UploadController extends BaseController {

	constructor(deploymentService) {
		super();
		this._deploymentService = deploymentService;
	}

	/**
	 * POST /upload
	 * Handles executable upload.
	 * Requires the following path parameters:
	 *  - app: name of a (registered) application
	 *  - version: version of the executable being uploaded
	 * Optional query parameter:
	 *  - autodeploy: if set to true, deployment commences immediately right after the upload finishes
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	uploadExecutable(req, resp) {

		logger.info(`File with originalName=${req.file.originalname} has been uploaded for app=${req.params.app} with version=${req.params.version}`);

		if (req.query.autodeploy) {
			this._deploymentService.deploy(req.params.app, req.params.version);
		}

		resp.status(HTTP_STATUS_CREATED).send();
	}
}