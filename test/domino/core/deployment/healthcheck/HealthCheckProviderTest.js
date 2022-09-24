import {afterEach, before, describe, it} from "mocha";
import * as mockery from "mockery";
import {assert} from "chai";

import AppRegistration from "../../../../../src/domino/core/domain/AppRegistrationDomain";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";

const _ASYNC_TIMEOUT = 5000;

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
		}).timeout(_ASYNC_TIMEOUT);

		it("should try health-check at most 3 times with eventual success", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProvider(503, 404, 200);
			const configuration = _prepareHealthCheckConfiguration(true);
			const registration = new AppRegistration("testApp-scenario2", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_OK);
		}).timeout(_ASYNC_TIMEOUT);

		it("should health-check exceed retry limit and fail", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProvider(503, 503, 503);
			const configuration = _prepareHealthCheckConfiguration(true);
			const registration = new AppRegistration("testApp-scenario3", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_FAILURE);
		}).timeout(_ASYNC_TIMEOUT);

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

		it("should return with failure in case of consecutive Promise.reject responses reaching limit", async () => {

			// given
			const healthCheckProvider = _prepareMockedHealthCheckProviderWithRejection();
			const configuration = _prepareHealthCheckConfiguration(true);
			const registration = new AppRegistration("testApp-scenario5", configuration);

			// when
			const result = await healthCheckProvider.executeHealthCheck(registration);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_FAILURE);
		});
	});

	function _prepareMockedHealthCheckProvider(...response) {

		let callCount = 0;
		mockery.deregisterAll();
		mockery.registerMock("axios", () => {
			return Promise.resolve({
				status: response[callCount++]
			});
		});

		return new (require("../../../../../src/domino/core/deployment/healthcheck/HealthCheckProvider.js").default)();
	}

	function _prepareMockedHealthCheckProviderWithRejection() {

		mockery.deregisterAll();
		mockery.registerMock("axios", () => {
			return Promise.reject(new Error("Failed to call app"));
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
