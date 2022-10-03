/**
 * Supported authorization modes.
 *
 * @type {Readonly<{DIRECT: string, OAUTH: string}>}
 */
export const AuthorizationMode = Object.freeze({

	/**
	 * Direct authorization using access tokens issued by /claim-token endpoint.
	 */
	DIRECT: "direct",

	/**
	 * Authorization using an external OAuth 2.0 Authorization Server.
	 */
	OAUTH: "oauth"
});
