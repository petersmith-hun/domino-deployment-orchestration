import BaseController, {HTTP_STATUS_ACCEPTED, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CREATED} from "./BaseController";
import LoggerFactory from "../../helper/LoggerFactory";
import {DeploymentStatus} from "../../core/domain/DeploymentStatus";

const logger = LoggerFactory.createLogger("LifecycleController");

/**
 * Controller implementation to handle lifecycle of registered applications.
 */
export default class LifecycleController extends BaseController {

	constructor(deploymentService, requestValidator) {
		super("lifecycle");
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
	async deploy(req, resp) {

		const version = req.params.version;
		const app = req.params.app;
		const deploymentStatus = await this._executeWithValidation(req, async () => {

			let deploymentStatus;
			if (version) {
				deploymentStatus = await this._deploymentService.deploy(app, version);
			} else {
				deploymentStatus = await this._deploymentService.deployLatest(app);
			}

			return deploymentStatus;
		});

		resp.status(this.mapDeploymentStatusToStatusCode(deploymentStatus.status))
			.send({
				message: `Deployed version=${version} in ${this.getProcessingTime(req)} ms`,
				status: deploymentStatus.status,
				version: deploymentStatus.version
			});
	}

	/**
	 * PUT /lifecycle/:app/start
	 * Starts the currently deployed version of the given application.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	async start(req, resp) {
		return this._executeLifecycleCommand(req, resp, (app) => this._deploymentService.start(app));
	}

	/**
	 * DELETE /lifecycle/:app/stop
	 * Stops the currently deployed version of the given application.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	async stop(req, resp) {
		return this._executeLifecycleCommand(req, resp, (app) => this._deploymentService.stop(app));
	}

	/**
	 * PUT /lifecycle/:app/restart
	 * Restarts the currently deployed version of the given application.
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	async restart(req, resp) {
		return this._executeLifecycleCommand(req, resp, (app) => this._deploymentService.restart(app));
	}

	async _executeWithValidation(req, commandSupplier) {

		let deploymentStatus;
		if (!this._requestValidator.isLifecycleRequestValid(req.params)) {
			logger.warn("Validation failed for deployment request");
			deploymentStatus = DeploymentStatus.INVALID_REQUEST;
		} else {
			deploymentStatus = await commandSupplier();
		}

		return deploymentStatus;
	}

	async _executeLifecycleCommand(req, resp, commandConsumer) {

		const deploymentStatus = await this._executeWithValidation(req, async () => await commandConsumer(req.params.app));

		resp.status(this.mapDeploymentStatusToStatusCode(deploymentStatus))
			.send({
				message: `Processed in ${this.getProcessingTime(req)} ms`,
				status: deploymentStatus
			});
	}
}
