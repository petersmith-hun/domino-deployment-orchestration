import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import {DeploymentStatus} from "../../../../src/domino/core/domain/DeploymentStatus";
import DeploymentService from "../../../../src/domino/core/service/DeploymentService";
import AppRegistrationRegistry from "../../../../src/domino/core/registration/AppRegistrationRegistry";
import DeploymentHandlerRegistry from "../../../../src/domino/core/deployment/DeploymentHandlerRegistry";
import ExecutableVersionUtility from "../../../../src/domino/core/util/ExecutableVersionUtility";
import HealthCheckProvider from "../../../../src/domino/core/deployment/healthcheck/HealthCheckProvider";
import AbstractDeploymentHandler from "../../../../src/domino/core/deployment/handler/AbstractDeploymentHandler";
import ExecutableVersion from "../../../../src/domino/core/domain/ExecutableVersion";
import LatestVersionAdapter from "../../../../src/domino/core/util/LatestVersionAdapter";

const TEST_APP = "test_app";
const TEST_LATEST_VERSION_STRING = "1.2.3.4";
const TEST_REGISTRATION = {TEST_APP: {}};

describe("Unit tests for DeploymentService", () => {

	let appRegistrationRegistryMock = null;
	let deploymentHandlerRegistryMock = null;
	let latestVersionAdapterMock = null;
	let healthCheckProviderMock = null;
	let handlerMock = null;
	let deploymentService = null;

	beforeEach(() => {
		appRegistrationRegistryMock = sinon.createStubInstance(AppRegistrationRegistry);
		deploymentHandlerRegistryMock = sinon.createStubInstance(DeploymentHandlerRegistry);
		latestVersionAdapterMock = sinon.createStubInstance(LatestVersionAdapter);
		healthCheckProviderMock = sinon.createStubInstance(HealthCheckProvider);
		handlerMock = sinon.createStubInstance(AbstractDeploymentHandler);

		deploymentService = new DeploymentService(appRegistrationRegistryMock, deploymentHandlerRegistryMock,
			latestVersionAdapterMock, healthCheckProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #deployLatest", () => {

		it("should deploy latest version with success (version as string)", async () => {

			// given
			_prepareMocks(TEST_LATEST_VERSION_STRING);

			// when
			const result = await deploymentService.deployLatest(TEST_APP);

			// then
			assert.equal(result.status, DeploymentStatus.DEPLOYED);
			assert.equal(result.version, TEST_LATEST_VERSION_STRING);
		});

		it("should deploy latest version with success (version as ExecutableVersion)", async () => {

			// given
			_prepareMocks(new ExecutableVersion(TEST_LATEST_VERSION_STRING));

			// when
			const result = await deploymentService.deployLatest(TEST_APP);

			// then
			assert.equal(result.status, DeploymentStatus.DEPLOYED);
			assert.equal(result.version, TEST_LATEST_VERSION_STRING);
		});

		it("should fail and generate deployment failure response", async () => {

			// given
			_prepareMocks(null);

			// when
			const result = await deploymentService.deployLatest(TEST_APP);

			// then
			assert.equal(result.status, DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION);
			assert.equal(result.version, "latest");
		});

		function _prepareMocks(version) {

			latestVersionAdapterMock.determineLatestVersion.withArgs(TEST_APP).returns(version);

			if (version !== null) {
				appRegistrationRegistryMock.getRegistration.withArgs(TEST_APP).returns(TEST_REGISTRATION);
				deploymentHandlerRegistryMock.getHandler.withArgs(TEST_REGISTRATION).returns(handlerMock);
				handlerMock.deploy.withArgs(TEST_REGISTRATION, new ExecutableVersion(TEST_LATEST_VERSION_STRING))
					.returns({
						status: DeploymentStatus.DEPLOYED,
						version: TEST_LATEST_VERSION_STRING
					});
			}
		}
	});

	describe("Test scenarios for #start", () => {

		it("should call start and execute health check", async () => {

			// given
			_prepareMocks(DeploymentStatus.UNKNOWN_STARTED);
			healthCheckProviderMock.executeHealthCheck.withArgs(TEST_REGISTRATION).returns(DeploymentStatus.HEALTH_CHECK_OK);

			// when
			const result = await deploymentService.start(TEST_APP);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_OK);
		});

		it("should call start and skip health check execution", async () => {

			// given
			_prepareMocks(DeploymentStatus.START_FAILURE);

			// when
			const result = await deploymentService.start(TEST_APP);

			// then
			assert.equal(result, DeploymentStatus.START_FAILURE);
			sinon.assert.notCalled(healthCheckProviderMock.executeHealthCheck);
		});

		function _prepareMocks(startStatus) {

			appRegistrationRegistryMock.getRegistration.withArgs(TEST_APP).returns(TEST_REGISTRATION);
			deploymentHandlerRegistryMock.getHandler.withArgs(TEST_REGISTRATION).returns(handlerMock);
			handlerMock.start.withArgs(TEST_REGISTRATION).returns(startStatus);
		}
	});

	describe("Test scenarios for #stop", () => {

		it("should call stop", async () => {

			// given
			appRegistrationRegistryMock.getRegistration.withArgs(TEST_APP).returns(TEST_REGISTRATION);
			deploymentHandlerRegistryMock.getHandler.withArgs(TEST_REGISTRATION).returns(handlerMock);
			handlerMock.stop.withArgs(TEST_REGISTRATION).returns(DeploymentStatus.UNKNOWN_STOPPED);

			// when
			const result = await deploymentService.stop(TEST_APP);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STOPPED);
		});
	});

	describe("Test scenarios for #restart", () => {

		it("should call restart and execute health check", async () => {

			// given
			_prepareMocks(DeploymentStatus.UNKNOWN_STARTED);
			healthCheckProviderMock.executeHealthCheck.withArgs(TEST_REGISTRATION).returns(DeploymentStatus.HEALTH_CHECK_OK);

			// when
			const result = await deploymentService.restart(TEST_APP);

			// then
			assert.equal(result, DeploymentStatus.HEALTH_CHECK_OK);
		});

		it("should call restart and skip health check execution", async () => {

			// given
			_prepareMocks(DeploymentStatus.START_FAILURE);

			// when
			const result = await deploymentService.restart(TEST_APP);

			// then
			assert.equal(result, DeploymentStatus.START_FAILURE);
			sinon.assert.notCalled(healthCheckProviderMock.executeHealthCheck);
		});

		function _prepareMocks(startStatus) {

			appRegistrationRegistryMock.getRegistration.withArgs(TEST_APP).returns(TEST_REGISTRATION);
			deploymentHandlerRegistryMock.getHandler.withArgs(TEST_REGISTRATION).returns(handlerMock);
			handlerMock.restart.withArgs(TEST_REGISTRATION).returns(startStatus);
		}
	});
});
