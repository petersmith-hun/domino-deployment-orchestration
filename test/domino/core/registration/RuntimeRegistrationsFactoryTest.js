import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import RuntimeRegistrationsFactory from "../../../../src/domino/core/registration/RuntimeRegistrationsFactory";

describe("Unit tests for RuntimeRegistrationsFactory", () => {

	let runtimeRegistrationsFactory = null;

	beforeEach(() => {
		runtimeRegistrationsFactory = new RuntimeRegistrationsFactory();
	});

	describe("Test scenarios for #createRuntimeRegistrations", () => {

		it("should create runtime registrations based on registrations config file", () => {

			// given
			const registrationsFile = {
				domino: {
					runtimes: [{
						java: {
							binary: "/usr/bin/java",
							"resource-marker": "-jar"
						},
					},{
						python: {
							binary: "/usr/bin/python",
							"resource-marker": ""
						}
					}]
				}
			};

			// when
			const result = runtimeRegistrationsFactory.createRuntimeRegistrations(registrationsFile);

			// then
			assert.equal(result.size, 2);
			assert.deepEqual(result.get("java"), {
				runtimeName: "java",
				binary: "/usr/bin/java",
				resourceMarker: "-jar"
			});
			assert.deepEqual(result.get("python"), {
				runtimeName: "python",
				binary: "/usr/bin/python",
				resourceMarker: ""
			});
		});

		it("should skip runtime registrations if missing", () => {

			// given
			const registrationsFile = {domino: {}};

			// when
			const result = runtimeRegistrationsFactory.createRuntimeRegistrations(registrationsFile);

			// then
			assert.equal(result.size, 0);
		});
	});
});
