import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import DockerRequestFactory from "../../../../../src/domino/core/deployment/docker/DockerRequestFactory";
import DockerSocketClient from "../../../../../src/domino/core/deployment/docker/DockerSocketClient";
import DockerDeploymentHandler from "../../../../../src/domino/core/deployment/handler/DockerDeploymentHandler";
import {DeploymentStatus} from "../../../../../src/domino/core/domain/DeploymentStatus";
import ExecutableVersion from "../../../../../src/domino/core/domain/ExecutableVersion";
import DockerRequest, {DockerCommand} from "../../../../../src/domino/core/domain/DockerRequest";

const _START_TIMEOUT = 150;
const _RAW_VERSION = "1.0";
const _VERSION = new ExecutableVersion(_RAW_VERSION);
const _IMAGE_NAME_WITH_HOME = "localhost:10000/test-app";
const _IMAGE_NAME_WITHOUT_HOME = "test-app";
const _REGISTRATION_WITH_HOME = {
	appName: "testapp",
	source: {
		home: "localhost:10000",
		resource: "test-app"
	}
};
const _REGISTRATION_WITHOUT_HOME = {
	appName: "testapp",
	source: {
		home: null,
		resource: "test-app"
	}
};
const _DOCKER_PULL_REQUEST = new DockerRequest(DockerCommand.PULL, null);
const _DOCKER_CREATE_REQUEST = new DockerRequest(DockerCommand.CREATE_CONTAINER, null);
const _DOCKER_REMOVE_REQUEST = new DockerRequest(DockerCommand.REMOVE, null);
const _DOCKER_START_REQUEST = new DockerRequest(DockerCommand.START, null);
const _DOCKER_STOP_REQUEST = new DockerRequest(DockerCommand.STOP, null);
const _DOCKER_RESTART_REQUEST = new DockerRequest(DockerCommand.RESTART, null);

describe("Unit tests for DockerDeploymentHandler", () => {

	let configurationProviderMock = null;
	let dockerSocketClientMock = null;
	let dockerRequestFactoryMock = null;
	let dockerDeploymentHandler = null;

	beforeEach(() => {
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		dockerSocketClientMock = sinon.createStubInstance(DockerSocketClient);
		dockerRequestFactoryMock = sinon.createStubInstance(DockerRequestFactory);

		configurationProviderMock.getStartTimeout.returns(_START_TIMEOUT);

		dockerDeploymentHandler = new DockerDeploymentHandler(configurationProviderMock, dockerSocketClientMock, dockerRequestFactoryMock);
	});

	describe("Test scenarios for #deploy", () => {

		it("should successfully deploy registration with home via Docker client", async () => {

			// given
			dockerRequestFactoryMock.createDockerPullRequest
				.withArgs(_IMAGE_NAME_WITH_HOME, _RAW_VERSION, _REGISTRATION_WITH_HOME)
				.returns(_DOCKER_PULL_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_PULL_REQUEST).resolves({
				statusCode: 200
			});
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.REMOVE)
				.returns(_DOCKER_REMOVE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_REMOVE_REQUEST).resolves({
				statusCode: 204
			});
			dockerRequestFactoryMock.createDockerContainerCreationRequest
				.withArgs(_IMAGE_NAME_WITH_HOME, _RAW_VERSION, _REGISTRATION_WITH_HOME)
				.returns(_DOCKER_CREATE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_CREATE_REQUEST).resolves({
				statusCode: 201
			});

			// when
			const result = await dockerDeploymentHandler.deploy(_REGISTRATION_WITH_HOME, _VERSION);

			// then
			assert.deepEqual(result, {
				status: DeploymentStatus.DEPLOYED,
				version: _VERSION.getRawVersion()
			});
		});

		it("should successfully deploy registration without home via Docker client", async () => {

			// given
			dockerRequestFactoryMock.createDockerPullRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_PULL_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_PULL_REQUEST).resolves({
				statusCode: 200
			});
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITHOUT_HOME, DockerCommand.REMOVE)
				.returns(_DOCKER_REMOVE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_REMOVE_REQUEST).resolves({
				statusCode: 204
			});
			dockerRequestFactoryMock.createDockerContainerCreationRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_CREATE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_CREATE_REQUEST).resolves({
				statusCode: 201
			});

			// when
			const result = await dockerDeploymentHandler.deploy(_REGISTRATION_WITHOUT_HOME, _VERSION);

			// then
			assert.deepEqual(result, {
				status: DeploymentStatus.DEPLOYED,
				version: _VERSION.getRawVersion()
			});
		});

		it("should successfully deploy registration without home via Docker client ignoring stopped container", async () => {

			// given
			dockerRequestFactoryMock.createDockerPullRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_PULL_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_PULL_REQUEST).resolves({
				statusCode: 200
			});
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITHOUT_HOME, DockerCommand.REMOVE)
				.returns(_DOCKER_REMOVE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_REMOVE_REQUEST).resolves({
				statusCode: 404
			});
			dockerRequestFactoryMock.createDockerContainerCreationRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_CREATE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_CREATE_REQUEST).resolves({
				statusCode: 201
			});

			// when
			const result = await dockerDeploymentHandler.deploy(_REGISTRATION_WITHOUT_HOME, _VERSION);

			// then
			assert.deepEqual(result, {
				status: DeploymentStatus.DEPLOYED,
				version: _VERSION.getRawVersion()
			});
		});

		it("should fail to deploy registration due to failed pull", async () => {

			// given
			dockerRequestFactoryMock.createDockerPullRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_PULL_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_PULL_REQUEST).resolves({
				statusCode: 500
			});

			// when
			const result = await dockerDeploymentHandler.deploy(_REGISTRATION_WITHOUT_HOME, _VERSION);

			// then
			sinon.assert.notCalled(dockerRequestFactoryMock.createDockerLifecycleCommand);
			sinon.assert.notCalled(dockerRequestFactoryMock.createDockerContainerCreationRequest);
			sinon.assert.calledOnce(dockerSocketClientMock.executeDockerCommand);
			assert.deepEqual(result, {
				status: DeploymentStatus.DEPLOY_FAILED_UNKNOWN,
				version: _VERSION.getRawVersion()
			});
		});

		it("should fail to deploy registration due to failed container creation", async () => {

			// given
			dockerRequestFactoryMock.createDockerPullRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_PULL_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_PULL_REQUEST).resolves({
				statusCode: 200
			});
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITHOUT_HOME, DockerCommand.REMOVE)
				.returns(_DOCKER_REMOVE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_REMOVE_REQUEST).resolves({
				statusCode: 204
			});
			dockerRequestFactoryMock.createDockerContainerCreationRequest
				.withArgs(_IMAGE_NAME_WITHOUT_HOME, _RAW_VERSION, _REGISTRATION_WITHOUT_HOME)
				.returns(_DOCKER_CREATE_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_CREATE_REQUEST).resolves({
				statusCode: 500
			});

			// when
			const result = await dockerDeploymentHandler.deploy(_REGISTRATION_WITHOUT_HOME, _VERSION);

			// then
			sinon.assert.calledThrice(dockerSocketClientMock.executeDockerCommand);
			assert.deepEqual(result, {
				status: DeploymentStatus.DEPLOY_FAILED_UNKNOWN,
				version: _VERSION.getRawVersion()
			});
		});
	});

	describe("Test scenarios for #start", () => {

		it("should return successfully start status", async () => {

			// given
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.START)
				.returns(_DOCKER_START_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_START_REQUEST).resolves({
				statusCode: 200
			});

			// when
			const result = await dockerDeploymentHandler.start(_REGISTRATION_WITH_HOME);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STARTED);
		});

		it("should return failed start status", async () => {

			// given
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.START)
				.returns(_DOCKER_START_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_START_REQUEST).resolves({
				statusCode: 500
			});

			// when
			const result = await dockerDeploymentHandler.start(_REGISTRATION_WITH_HOME);

			// then
			assert.equal(result, DeploymentStatus.START_FAILURE);
		});
	});

	describe("Test scenarios for #stop", () => {

		it("should return successfully stop status", async () => {

			// given
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.STOP)
				.returns(_DOCKER_STOP_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_STOP_REQUEST).resolves({
				statusCode: 200
			});

			// when
			const result = await dockerDeploymentHandler.stop(_REGISTRATION_WITH_HOME);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STOPPED);
		});

		it("should return failed stop status", async () => {

			// given
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.STOP)
				.returns(_DOCKER_STOP_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_STOP_REQUEST).resolves({
				statusCode: 500
			});

			// when
			const result = await dockerDeploymentHandler.stop(_REGISTRATION_WITH_HOME);

			// then
			assert.equal(result, DeploymentStatus.STOP_FAILURE);
		});
	});

	describe("Test scenarios for #restart", () => {

		it("should return successfully restart status", async () => {

			// given
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.RESTART)
				.returns(_DOCKER_RESTART_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_RESTART_REQUEST).resolves({
				statusCode: 200
			});

			// when
			const result = await dockerDeploymentHandler.restart(_REGISTRATION_WITH_HOME);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STARTED);
		});

		it("should return failed restart status", async () => {

			// given
			dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(_REGISTRATION_WITH_HOME, DockerCommand.RESTART)
				.returns(_DOCKER_RESTART_REQUEST);
			dockerSocketClientMock.executeDockerCommand.withArgs(_DOCKER_RESTART_REQUEST).resolves({
				statusCode: 500
			});

			// when
			const result = await dockerDeploymentHandler.restart(_REGISTRATION_WITH_HOME);

			// then
			assert.equal(result, DeploymentStatus.START_FAILURE);
		});
	});
});
