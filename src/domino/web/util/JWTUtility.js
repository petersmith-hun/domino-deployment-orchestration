import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import AuthenticationError from "../error/AuthenticationError";
import LoggerFactory from "../../helper/LoggerFactory";

const _BEARER_TOKEN_MATCHER = /^Bearer (.+)$/;
const _JWT_ISSUER = "domino";

const logger = LoggerFactory.createLogger("JWTUtility");

/**
 * Utility class for handling JWT tokens.
 */
export default class JWTUtility {

	constructor(configurationProvider) {
		this._securityConfig = configurationProvider.getSecurityConfig();
	}

	/**
	 * Authenticates a token claim request and creates the token in case of success.
	 *
	 * @param authRequest - object containing a username and a password
	 * @returns created JWT token
	 * @throws AuthenticationError in case of the failed authenticated
	 */
	createToken(authRequest) {

		if (!this._authenticate(authRequest)) {
			logger.error("Authentication failure - invalid credentials, rejecting token creation");
			throw new AuthenticationError("Authentication failure - invalid claim");
		}

		logger.info(`Service ${authRequest.username} successfully authenticated - generating token.`);

		return jwt.sign({service: authRequest.username}, this._securityConfig["jwt-private-key"], {
			expiresIn: this._securityConfig.expiration,
			issuer: _JWT_ISSUER
		});
	}

	/**
	 * Verifies the received token.
	 * Authorization header must be passed for verification; also it must contain the token as 'Bearer'.
	 *
	 * @param authorization Authorization header parameter
	 * @throws AuthenticationError in case of token verification failure
	 */
	verifyToken(authorization) {

		let decodedToken;
		try {
			const token = this._extractToken(authorization);
			decodedToken = jwt.verify(token, this._securityConfig["jwt-private-key"]);
		} catch (e) {
			logger.error("Token verification failed: ", e);
			throw new AuthenticationError("Authentication failure - token verification failed");
		}

		if (decodedToken.service !== this._securityConfig.username) {
			logger.error(`Unknown service user=${decodedToken.service} - token validation failed`);
			throw new AuthenticationError();
		}
	}

	_authenticate(authRequest) {
		return authRequest.username === this._securityConfig.username
			&& bcrypt.compareSync(authRequest.password, this._securityConfig.password);
	}

	_extractToken(authorization) {
		return authorization.match(_BEARER_TOKEN_MATCHER)[1];
	}
}
