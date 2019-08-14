import logManager from "../../../domino_main";
import BaseController, {HTTP_STATUS_CREATED} from "./BaseController";

const logger = logManager.createLogger("UploadController");

/**
 * Controller implementation to handler executable binary uploads.
 */
export default class UploadController extends BaseController {

	/**
	 * POST /upload
	 * Handles executable upload.
	 * Requires the following path parameters:
	 *  - app: name of a (registered) application
	 *  - version: version of the executable being uploaded
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	uploadExecutable(req, resp) {

		logger.info(`File with originalName=${req.file.originalname} has been uploaded for app=${req.params.app} with version=${req.params.version}`);

		resp.status(HTTP_STATUS_CREATED).send();
	}
}