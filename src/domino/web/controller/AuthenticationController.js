import BaseController, {HTTP_STATUS_CREATED} from "./BaseController";

/**
 * Controller implementation to handle authentication requests.
 */
export default class AuthenticationController extends BaseController {

	constructor(jwtUtility) {
		super("auth");
		this._jwtUtility = jwtUtility;
	}

	/**
	 * Claims a JWT token with the credentials provided in request body (as username and password fields).
	 *
	 * @param req Express request object
	 * @param resp Express response object
	 */
	claimToken(req, resp) {

		resp.status(HTTP_STATUS_CREATED)
			.send({
				jwt: this._jwtUtility.createToken(req.body)
			});
	}
}
