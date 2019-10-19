import BaseController, {HTTP_STATUS_ACCEPTED, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CREATED} from "./BaseController";
import logManager from "../../../domino_main";

const logger = logManager.createLogger("LifecycleController");

/**
 * Controller implementation to handle lifecycle of registered applications.
 */
export default class LifecycleController extends BaseController {

	constructor(deploymentService, requestValidator) {
		super();
		this._deploymentService = deploymentService;
		this._requestValidator = requestValidator;
	}

	/**
	 * PUT /lifecycle/:app/deploy[/:version]
	 * Prepares given application for execution.
	 * Omitting version path parameter instructs Domino to select the latest available version.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	deploy(req, resp) {

		let version = req.params.version;
		const responseStatus = this._executeWithValidation(req, () => {

			if (req.params.version) {
				this._deploymentService.deploy(req.params.app, req.params.version);
			} else {
				version = this._deploymentService.deployLatest(req.params.app);
			}

			return HTTP_STATUS_CREATED;
		});

		resp.status(responseStatus)
			.send({
				message: `Deployed version=${version} in ${this.getProcessingTime(req)} ms`
			});
	}

	/**
	 * PUT /lifecycle/:app/start
	 * Starts the currently deployed version of the given application.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	start(req, resp) {
		this._executeLifecycleCommand(req, resp, (app) => this._deploymentService.start(app));
	}

	/**
	 * DELETE /lifecycle/:app/stop
	 * Stops the currently deployed version of the given application.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	stop(req, resp) {
		this._executeLifecycleCommand(req, resp, (app) => this._deploymentService.stop(app));
	}

	/**
	 * PUT /lifecycle/:app/restart
	 * Restarts the currently deployed version of the given application.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	restart(req, resp) {
		this._executeLifecycleCommand(req, resp, (app) => this._deploymentService.restart(app));
	}

	_executeWithValidation(req, commandSupplier) {

		let responseStatus = HTTP_STATUS_CREATED;
		if (!this._requestValidator.isLifecycleRequestValid(req.params)) {
			logger.warn("Validation failed for deployment request");
			responseStatus = HTTP_STATUS_BAD_REQUEST;
		} else {
			responseStatus = commandSupplier();
		}

		return responseStatus;
	}

	_executeLifecycleCommand(req, resp, commandConsumer) {

		const responseStatus = this._executeWithValidation(req, () => {
			commandConsumer(req.params.app);
			return HTTP_STATUS_ACCEPTED;
		});

		resp.status(responseStatus)
			.send({
				message: `Processed in ${this.getProcessingTime(req)} ms`
			});
	}
}
