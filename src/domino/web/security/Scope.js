/**
 * Registered OAuth scope values.
 *
 * @type {Readonly<{WRITE_DEPLOY: string, WRITE_RESTART: string, WRITE_START: string, WRITE_DELETE: string, READ_INFO: string, WRITE_UPLOAD: string}>}
 */
export const Scope = Object.freeze({

	READ_INFO: "read:info",
	WRITE_DEPLOY: "write:deploy",
	WRITE_START: "write:start",
	WRITE_RESTART: "write:delete write:start",
	WRITE_DELETE: "write:delete",
	WRITE_UPLOAD: "write:upload"
});
