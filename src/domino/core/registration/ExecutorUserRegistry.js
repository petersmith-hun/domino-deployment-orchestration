import child_process from "child_process";

/**
 * This registry stores the registered executor (service-) users.
 * Warning: root user is not allowed to be an executor!
 */
export default class ExecutorUserRegistry {

	constructor() {
		this._users = new Map();
	}

	/**
	 * Starts registering the executor users based on the configured registrations.
	 * If two or more registrations uses the same executor user, it will be registered only once.
	 *
	 * Validation constraints applicable to the executor users:
	 *  - cannot be root
	 *  - shall contain only upper- or lowercase alphanumerical characters, numbers, dash or underscore
	 *  - must be an existing OS service user
	 *
	 * @param registrations list of configured registrations
	 */
	registerExecutorUsers(registrations) {
		registrations.forEach((registration) => {
			const username = registration.execution.user;
			if (!this._users.get(username)) {
				this._users.set(username, this._findUserID(username));
			}
		});
	}

	/**
	 * Returns the user ID of the executor user attached to the given registration.
	 *
	 * @param registration registration to return executor user ID for
	 * @returns registered executor user ID
	 * @throws Error if the specified executor user is not registered
	 */
	getUserID(registration) {

		const userID = this._users.get(registration.execution.user);
		if (!userID) {
			throw new Error(`User '${registration.execution.user} is not registered`);
		}

		return userID;
	}

	_findUserID(username) {

		if (username === "root") {
			throw new Error("Root user cannot be an executor");
		}

		if (!this._isUsernameValid(username)) {
			throw new Error(`Provided username '${username}' is prohibited`);
		}

		try {
			const idCallResult = child_process.execSync(`id -u ${username}`).toString();
			return parseInt(idCallResult);
		} catch (e) {
			throw new Error(`Provider user with username '${username}' does not exist`);
		}
	}

	_isUsernameValid(username) {
		return username.match(/^[a-zA-Z0-9_\-]+$/) !== null;
	}
}
