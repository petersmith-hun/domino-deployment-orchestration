import BaseController, {HTTP_STATUS_CREATED} from "./BaseController";
import AuthenticationError from "../error/AuthenticationError";
import {AuthorizationMode} from "../../core/domain/AuthorizationMode";
import LoggerFactory from "../../helper/LoggerFactory";

const logger = LoggerFactory.createLogger("AuthenticationController");

/**
 * Controller implementation to handle authentication requests.
 */
export default class AuthenticationController extends BaseController {

	constructor(jwtUtility, configurationProvider) {
		super("auth");
		this._jwtUtility = jwtUtility;
		this._authenticationMode = configurationProvider.getAuthorizationMode();

		if (this._authenticationMode === AuthorizationMode.OAUTH) {
			logger.warn("Claim token endpoint is disabled by currently active authorization mode");
		}
	}

	/**
	 * Claims a JWT token with the credentials provided in request body (as username and password fields).
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	claimToken(req, resp) {

		if (this._authenticationMode === AuthorizationMode.OAUTH) {
			throw new AuthenticationError("Unsupported authentication method");
		}

		resp.status(HTTP_STATUS_CREATED)
			.send({
				jwt: this._jwtUtility.createToken(req.body)
			});
	}
}
