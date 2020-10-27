/**
 * Possible application info request response statuses.
 */
export const InfoStatus = Object.freeze({

	/**
	 * Info request is fulfilled.
	 */
	PROVIDED: "PROVIDED",

	/**
	 * Info endpoint of the registration is not configured.
	 */
	NON_CONFIGURED: "NON_CONFIGURED",

	/**
	 * Info endpoint of the registration is misconfigured, returning unprocessable/malformed data.
	 */
	MISCONFIGURED: "MISCONFIGURED",

	/**
	 * Failed to reach the registration's info endpoint.
	 */
	FAILED: "FAILED"
});
