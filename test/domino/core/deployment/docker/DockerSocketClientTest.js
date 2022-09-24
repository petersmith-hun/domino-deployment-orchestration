import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";
import * as mockery from "mockery";
import ConfigurationProvider from "../../../../../src/domino/core/config/ConfigurationProvider";
import DockerSocketResponseHandler from "../../../../../src/domino/core/deployment/docker/DockerSocketResponseHandler";
import DockerRequest, {DockerCommand} from "../../../../../src/domino/core/domain/DockerRequest";

const _DOCKER_CONFIG = {
	socket: "/path/to/socket.sock",
	servers: [{
		host: "localhost:10000",
		username: "user1",
		password: "pass1"
	}, {
		host: "localhost:10001",
		username: "user2",
		password: "pass2"
	}]
};
const _REGISTRATION = {
	appName: "testapp",
	source: {
		home: "localhost:10000/apps"
	}
};

describe("Unit tests for DockerSocketClient", () => {
	
	let configurationProviderMock = null;
	let dockerSocketResponseHandlerMock = null;

	let dockerSocketClient = null;
	
	beforeEach(() => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		});

		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		dockerSocketResponseHandlerMock = sinon.createStubInstance(DockerSocketResponseHandler);
		configurationProviderMock.getDockerConfig.returns(_DOCKER_CONFIG);
	});

	afterEach(() => {
		sinon.restore();
		mockery.resetCache();
	});
	
	describe("Test scenarios for #executeDockerCommand", () => {

		it("should prepare non-authenticated Docker request and request context", async () => {

			// given
			dockerSocketClient = _prepareDockerSocketClient();
			const command = DockerCommand.START;
			const dockerRequest = new DockerRequest(command, _REGISTRATION)
				.addUrlParameter("id", "test-app");

			// when
			const resultPromise = dockerSocketClient.executeDockerCommand(dockerRequest);

			// then
			await _waitForResolution();
			const responseHandlerCallArgument = dockerSocketResponseHandlerMock.readDockerResponse.getCall(0).args[0];
			responseHandlerCallArgument.resolutionHandler();
			await resultPromise;

			assert.equal(responseHandlerCallArgument.dockerVersion, "Unidentified");
			assert.equal(responseHandlerCallArgument.responseHandlerPolicy, command.responseHandlerPolicy);
			assert.equal(responseHandlerCallArgument.commandName, "START");
			assert.equal(responseHandlerCallArgument.registrationName, _REGISTRATION.appName);
			// responseObject is substituted by requestOptions at mock registration
			assert.deepEqual(responseHandlerCallArgument.responseObject, {
				method: command.method,
				url: "/v1.40/containers/test-app/start",
				socketPath: _DOCKER_CONFIG.socket,
				data: null,
				validateStatus: false,
				responseType: "stream",
				headers: {
					"Host": null,
					"X-Registry-Auth": null
				}
			});
		});

		it("should prepare authenticated Docker request and request context", async () => {

			// given
			dockerSocketClient = _prepareDockerSocketClient();
			const command = DockerCommand.PULL;
			const dockerRequest = new DockerRequest(command, _REGISTRATION)
				.addUrlParameter("image", "app_image")
				.addUrlParameter("tag", "1.0");

			// when
			const resultPromise = dockerSocketClient.executeDockerCommand(dockerRequest);

			// then
			await _waitForResolution();
			const responseHandlerCallArgument = dockerSocketResponseHandlerMock.readDockerResponse.getCall(0).args[0];
			responseHandlerCallArgument.resolutionHandler();
			await resultPromise;

			assert.equal(responseHandlerCallArgument.dockerVersion, "Unidentified");
			assert.equal(responseHandlerCallArgument.responseHandlerPolicy, command.responseHandlerPolicy);
			assert.equal(responseHandlerCallArgument.commandName, "PULL");
			assert.equal(responseHandlerCallArgument.registrationName, _REGISTRATION.appName);
			// responseObject is substituted by requestOptions at mock registration
			assert.deepEqual(responseHandlerCallArgument.responseObject, {
				method: command.method,
				url: "/v1.40/images/create?fromImage=app_image&tag=1.0",
				socketPath: _DOCKER_CONFIG.socket,
				data: null,
				validateStatus: false,
				responseType: "stream",
				headers: {
					"Host": null,
					"X-Registry-Auth": "eyJzZXJ2ZXJhZGRyZXNzIjoibG9jYWxob3N0OjEwMDAwIiwidXNlcm5hbWUiOiJ1c2VyMSIsInBhc3N3b3JkIjoicGFzczEifQ=="
				}
			});
		});

		it("should prepare authenticated Docker request and request context without configured server", async () => {

			// given
			dockerSocketClient = _prepareDockerSocketClient();
			const registration = {
				appName: "testapp",
				source: {
					home: "localhost:10003/apps"
				}
			};
			const command = DockerCommand.PULL;
			const dockerRequest = new DockerRequest(command, registration)
				.addUrlParameter("image", "app_image")
				.addUrlParameter("tag", "1.0");

			// when
			const resultPromise = dockerSocketClient.executeDockerCommand(dockerRequest);

			// then
			await _waitForResolution();
			const responseHandlerCallArgument = dockerSocketResponseHandlerMock.readDockerResponse.getCall(0).args[0];
			responseHandlerCallArgument.resolutionHandler();
			await resultPromise;

			assert.equal(responseHandlerCallArgument.dockerVersion, "Unidentified");
			assert.equal(responseHandlerCallArgument.responseHandlerPolicy, command.responseHandlerPolicy);
			assert.equal(responseHandlerCallArgument.commandName, "PULL");
			assert.equal(responseHandlerCallArgument.registrationName, registration.appName);
			// responseObject is substituted by requestOptions at mock registration
			assert.deepEqual(responseHandlerCallArgument.responseObject, {
				method: command.method,
				url: "/v1.40/images/create?fromImage=app_image&tag=1.0",
				socketPath: _DOCKER_CONFIG.socket,
				data: null,
				validateStatus: false,
				responseType: "stream",
				headers: {
					"Host": null,
					"X-Registry-Auth": null
				}
			});
		});

		it("should handle promise rejection by axios client", async () => {

			// given
			dockerSocketClient = _prepareDockerSocketClient(true);
			const command = DockerCommand.START;
			const dockerRequest = new DockerRequest(command, _REGISTRATION)
				.addUrlParameter("id", "test-app");

			// when
			const resultPromise = dockerSocketClient.executeDockerCommand(dockerRequest);

			// then
			await _waitForResolution();
			let rejectionCaught = false;
			resultPromise
				.catch(reason => {
					rejectionCaught = true;
					assert.equal(reason, "connection error");
				})
				.finally(() => assert.equal(rejectionCaught, true));
		});
	});
	
	describe("Test scenarios for #identifyDocker", () => {

		it("should successfully identify Docker and store engine version", async () => {

			// given
			dockerSocketClient = _prepareDockerSocketClient();

			// when
			dockerSocketClient.identifyDocker();

			// then
			await _waitForResolution();
			const responseHandlerCallArgument = dockerSocketResponseHandlerMock.readDockerResponse.getCall(0).args[0];
			responseHandlerCallArgument.resolutionHandler({
				responseData: {
					Version: "19.03",
					ApiVersion: "v1.40"
				}
			});
			await _waitForResolution();

			assert.equal(responseHandlerCallArgument.commandName, "IDENTIFY");
			assert.equal(dockerSocketClient._dockerVersion, "19.03");
		});

		it("should fail to identify Docker and set engine version to Unavailable", async () => {

			// given
			dockerSocketClient = _prepareDockerSocketClient();

			// when
			dockerSocketClient.identifyDocker();

			// then
			await _waitForResolution();
			const responseHandlerCallArgument = dockerSocketResponseHandlerMock.readDockerResponse.getCall(0).args[0];
			responseHandlerCallArgument.rejectionHandler("Connection refused");
			await _waitForResolution();

			assert.equal(responseHandlerCallArgument.commandName, "IDENTIFY");
			assert.equal(dockerSocketClient._dockerVersion, "Unavailable");
		});
	});

	function _prepareDockerSocketClient(reject = false) {

		mockery.deregisterAll();
		// mock with a little hack so test suite is able to access the generated requestOptions
		mockery.registerMock("axios", (requestOptions) => reject
			? Promise.reject("connection error")
			: Promise.resolve(requestOptions));

		return new (require("../../../../../src/domino/core/deployment/docker/DockerSocketClient").default)(configurationProviderMock, dockerSocketResponseHandlerMock);
	}

	async function _waitForResolution() {
		return new Promise(resolve => setTimeout(() => resolve(), 100));
	}
});
