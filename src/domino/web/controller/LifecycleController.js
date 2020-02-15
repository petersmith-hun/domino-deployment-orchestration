import BaseController from "./BaseController";
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
		const deploymentResponse = await this._executeWithValidation(req, async () => {

			let deploymentResponse;
			if (version) {
				deploymentResponse = await this._deploymentService.deploy(app, version);
			} else {
				deploymentResponse = await this._deploymentService.deployLatest(app);
			}

			return deploymentResponse;
		}, (response) => response);

		resp.status(this.mapDeploymentStatusToStatusCode(deploymentResponse.status))
			.send(this._generateDeployResponse(req, deploymentResponse));
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

	async _executeWithValidation(req, commandSupplier, validationResponseMapper = (response) => response.status) {

		let deploymentResponse;
		if (!this._requestValidator.isLifecycleRequestValid(req.params)) {
			logger.warn("Validation failed for deployment request");
			deploymentResponse = validationResponseMapper({status: DeploymentStatus.INVALID_REQUEST});
		} else {
			deploymentResponse = await commandSupplier();
		}

		return deploymentResponse;
	}

	async _executeLifecycleCommand(req, resp, commandConsumer) {

		const deploymentStatus = await this._executeWithValidation(req, async () => await commandConsumer(req.params.app));

		resp.status(this.mapDeploymentStatusToStatusCode(deploymentStatus))
			.send({
				message: `Processed in ${this.getProcessingTime(req)} ms`,
				status: deploymentStatus
			});
	}

	_generateDeployResponse(req, deploymentResponse) {

		let response;
		if (deploymentResponse.status === DeploymentStatus.INVALID_REQUEST) {
			response = {
				message: `Deployment has failed due to invalid request`,
			}
		} else {
			response = {
				message: `Deployment has finished for version=${deploymentResponse.version} in ${this.getProcessingTime(req)} ms`,
				version: deploymentResponse.version
			};
		}
		response.status = deploymentResponse.status;

		return response;
	}
}
