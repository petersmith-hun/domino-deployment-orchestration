import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import child_process from "child_process";
import ExecutorUserRegistry from "../../../../src/domino/core/registration/ExecutorUserRegistry";

describe("Unit tests for ExecutorUserRegistry", () => {

	let executorUserRegistry = null;

	beforeEach(() => {
		executorUserRegistry = new ExecutorUserRegistry();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #registerExecutorUsers", () => {

		it("should register all users defined in registrations", () => {

			// given
			sinon.stub(child_process, "execSync").callsFake((command) => {
				switch (command) {
					case "id -u leaflet-user":
						return 123;
					case "id -u tlp-user":
						return 456;
					default:
						assert.fail("Test case received invalid parameter for 'id' call");
				}

				return null;
			});
			const registrations = new Map();
			registrations.set("leaflet", {execution: {user: "leaflet-user"}});
			registrations.set("tlp", {execution: {user: "tlp-user"}});
			registrations.set("tms", {execution: {user: "leaflet-user"}});

			// when
			executorUserRegistry.registerExecutorUsers(registrations);

			// then
			assert.equal(executorUserRegistry._users.size, 2);
			assert.equal(executorUserRegistry._users.get("leaflet-user"), 123);
			assert.equal(executorUserRegistry._users.get("tlp-user"), 456);
		});

		const invalidUsernameScenarios = ["root", "../", "user**"];

		invalidUsernameScenarios.forEach(username => {

			it(`should throw error when an invalid username (${username}) is passed`, () => {

				// given
				const registrations = new Map();
				registrations.set("leaflet", {execution: {user: username}});

				try {

					// when
					executorUserRegistry.registerExecutorUsers(registrations);

					assert.fail("Test case should have thrown error");
				} catch (e) {

					// then
					// exception expected
					assert.equal(e.message, username === "root"
						? "Root user cannot be an executor"
						: `Provided username '${username}' is prohibited`);
				}
			});
		});

		it("should throw error for non existing user", () => {

			// given
			const registrations = new Map();
			registrations.set("leaflet", {execution: {user: "leaflet-user"}});
			sinon.stub(child_process, "execSync").throws(new Error("command failed"));

			try {

				// when
				executorUserRegistry.registerExecutorUsers(registrations);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				// exception expected
			}
		});
	});

	describe("Test scenarios for #getUserID", () => {

		it("should return the user ID of the registered user", () => {

			// given
			const registration = {execution: {user: "leaflet-user"}};
			executorUserRegistry._users.set("leaflet-user", 999);

			// when
			const result = executorUserRegistry.getUserID(registration);

			// then
			assert.equal(result, 999);
		});

		it("should throw error in case of non-registered user", () => {

			// given
			const registration = {execution: {user: "leaflet-user"}};
			executorUserRegistry._users.set("tlp-user", 999);

			try {

				// when
				executorUserRegistry.getUserID(registration);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				// exception expected
				assert.equal(e.message, `User '${registration.execution.user} is not registered`);
			}
		});
	});
});
