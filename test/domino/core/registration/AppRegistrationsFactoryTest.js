import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";

import AppRegistrationsFactory from "../../../../src/domino/core/registration/AppRegistrationsFactory";

describe("Unit tests for AppRegistrationsFactory", () => {

	let appRegistrationsFactory = null;

	beforeEach(() => {
		appRegistrationsFactory = new AppRegistrationsFactory();
	});

	describe("Test scenarios for #createRegistrations", () => {

		it("should properly create app registrations based on registrations config file", () => {

			// given
			const registrationsFile = {
				domino: {
					registrations: [{
						leaflet: {
							source: {
								type: "FILESYSTEM",
								home: "/apps",
								resource: "leaflet.jar"
							},
							execution: {
								"as-user": "leaflet-user",
								via: "EXECUTABLE",
								args: ["--arg1", "--arg2"]
							}
						}
					}, {
						tlp: {
							source: {
								type: "FILESYSTEM",
								home: "/apps",
								resource: "tlp.jar"
							},
							execution: {
								"command-name": "tlp-svc",
								via: "SERVICE"
							},
							"health-check": {
								enabled: true,
								delay: "10 sec",
								timeout: "2 sec",
								"max-attempts": 3,
								endpoint: "http://localhost:9090/tlp/healthcheck"
							}
						}
					}, {
						tms: {
							source: {
								type: "FILESYSTEM",
								home: "/apps",
								resource: "tms.jar"
							},
							runtime: "java",
							execution: {
								"as-user": "tms-user",
								via: "RUNTIME",
								args: "arg3"
							},
							"health-check": {
								enabled: false
							}
						}
					}]
				}
			};

			// when
			const result = appRegistrationsFactory.createRegistrations(registrationsFile);

			// then
			assert.equal(result.size, 3);
			assert.deepEqual(result.get("leaflet"), {
				appName: "leaflet",
				source: {
					type: "FILESYSTEM",
					home: "/apps",
					resource: "leaflet.jar"
				},
				runtime: undefined,
				healthCheck: {},
				execution: {
					commandName: undefined,
					user: "leaflet-user",
					executionHandler: "EXECUTABLE",
					args: ["--arg1", "--arg2"]
				}
			});
			assert.deepEqual(result.get("tlp"), {
				appName: "tlp",
				source: {
					type: "FILESYSTEM",
					home: "/apps",
					resource: "tlp.jar"
				},
				runtime: undefined,
				healthCheck: {
					enabled: true,
					delay: 10000,
					timeout: 2000,
					maxAttempts: 3,
					endpoint: "http://localhost:9090/tlp/healthcheck"
				},
				execution: {
					commandName: "tlp-svc",
					user: undefined,
					executionHandler: "SERVICE",
					args: undefined
				}
			});
			assert.deepEqual(result.get("tms"), {
				appName: "tms",
				source: {
					type: "FILESYSTEM",
					home: "/apps",
					resource: "tms.jar"
				},
				runtime: "java",
				healthCheck: {},
				execution: {
					commandName: undefined,
					user: "tms-user",
					executionHandler: "RUNTIME",
					args: "arg3"
				}
			});
		});

		it("should throw error for invalid source type", () => {

			// given
			const registrationsFile = {
				domino: {
					registrations: [{
						leaflet: {
							source: {
								type: "OTHER",
							}
						}
					}]
				}
			};

			try {

				// when
				appRegistrationsFactory.createRegistrations(registrationsFile);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// exception expected
				assert.equal(e.message, "Invalid source type OTHER");
			}
		});

		it("should throw error for invalid execution handler", () => {

			// given
			const registrationsFile = {
				domino: {
					registrations: [{
						leaflet: {
							source: {
								type: "FILESYSTEM",
							},
							execution: {
								via: "OTHER",
							}
						}
					}]
				}
			};

			try {

				// when
				appRegistrationsFactory.createRegistrations(registrationsFile);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// exception expected
				assert.equal(e.message, "Invalid execution handler OTHER");
			}
		});
	});
});
