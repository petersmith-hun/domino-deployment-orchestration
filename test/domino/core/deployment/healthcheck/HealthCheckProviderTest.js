import {afterEach, before, describe, it} from "mocha";
import AppRegistration from "../../../../../src/domino/core/domain/AppRegistrationDomain";
import * as mockery from "mockery";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";
const assert = require('chai').assert;

describe("Unit tests for HealthCheckProvider", () => {

	before(() => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		});
	});

	afterEach(() => {
		mockery.resetCache();
	});

	describe("Test scenarios for #executeHealthCheck", () => {

		it("should health-check return with success on first try", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProvider(200);
			const configuration = _prepareHealthCheckConfiguration(true);
			const registration = new AppRegistration("testApp-scenario1", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_OK);
		});

		it("should try health-check at most 3 times with eventual success", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProvider(503, 404, 200);
			const configuration = _prepareHealthCheckConfiguration(true);
			const registration = new AppRegistration("testApp-scenario2", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_OK);
		});

		it("should health-check exceed retry limit and fail", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProvider(503, 503, 503);
			const configuration = _prepareHealthCheckConfiguration(true);
			const registration = new AppRegistration("testApp-scenario3", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_FAILURE);
		});

		it("should skip health-check when disabled and immediately return with success", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProvider();
			const configuration = _prepareHealthCheckConfiguration(false);
			const registration = new AppRegistration("testApp-scenario4", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STARTED);
		});
	});

	function _prepareMockedHealthCheckProvider(...response) {

		let callCount = 0;
		mockery.deregisterAll();
		mockery.registerMock("request-promise", () => {
			return Promise.resolve({
				statusCode: response[callCount++]
			});
		});

		return new (require("../../../../../src/domino/core/deployment/healthcheck/HealthCheckProvider.js").default)();
	}

	function _prepareHealthCheckConfiguration(enabled) {
		return {
			"health-check": {
				"enabled": enabled,
				"endpoint": "http://localhost:9999/test",
				"delay": "500 ms",
				"timeout": "250 ms",
				"max-attempts": 3
			}
		};
	}
});
