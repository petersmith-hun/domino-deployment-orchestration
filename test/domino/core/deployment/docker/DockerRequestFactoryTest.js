import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";
import DockerRequestFactory from "../../../../../src/domino/core/deployment/docker/DockerRequestFactory";
import DockerCreateContainerRequestMapper
	from "../../../../../src/domino/core/deployment/docker/DockerCreateContainerRequestMapper";
import {DockerCommand} from "../../../../../src/domino/core/domain/DockerRequest";

const _IMAGE_NAME = "test";
const _TAG = "1.0";
const _REQUEST_BODY = {
	Env: {
		ENV_1: "value"
	}
};

describe("Unit tests for DockerRequestFactory", () => {

	let dockerCreateContainerRequestMapperMock = null;
	let dockerRequestFactory = null;

	beforeEach(() => {
		dockerCreateContainerRequestMapperMock = sinon.createStubInstance(DockerCreateContainerRequestMapper);

		dockerRequestFactory = new DockerRequestFactory(dockerCreateContainerRequestMapperMock);
	});

	describe("Test scenarios for #createDockerContainerCreationRequest", () => {

		it("should create container creation request based on strict request", () => {

			// given
			const registration = _prepareRegistration(false);
			dockerCreateContainerRequestMapperMock.prepareContainerCreationRequest.withArgs(registration).returns(_REQUEST_BODY);

			// when
			const result = dockerRequestFactory.createDockerContainerCreationRequest(_IMAGE_NAME, _TAG, registration);

			// then
			_verifyResult(result, registration);
		});

		it("should create container creation request based on custom request", () => {

			// given
			const registration = _prepareRegistration(true);

			// when
			const result = dockerRequestFactory.createDockerContainerCreationRequest(_IMAGE_NAME, _TAG, registration);

			// then
			_verifyResult(result, registration)
		});

		function _prepareRegistration(withCustomRequest) {

			return {
				appName: "testapp",
				source: {
					home: "localhost:10000"
				},
				execution: {
					commandName: "test-app",
					args: {
						custom: withCustomRequest
							? _REQUEST_BODY
							: null
					}
				}
			};
		}

		function _verifyResult(result, registration) {
			assert.equal(result.getCommand(), DockerCommand.CREATE_CONTAINER);
			assert.equal(result.getImageHome(), registration.source.home);
			assert.equal(result.getRegistrationName(), registration.appName);
			assert.deepEqual(result.getUrlParameters(), new Map([
				["name", registration.execution.commandName]
			]));
			assert.equal(result.getBody().Image, `${_IMAGE_NAME}:${_TAG}`);
			assert.deepEqual(result.getBody(), _REQUEST_BODY);
		}
	});

	describe("Test scenarios for #createDockerPullRequest", () => {

		it('should create pull request', function () {

			// given
			const registration = {
				appName: "testapp",
				source: {
					home: "localhost:10000"
				}
			};

			// when
			const result = dockerRequestFactory.createDockerPullRequest(_IMAGE_NAME, _TAG, registration);

			// then
			assert.equal(result.getCommand(), DockerCommand.PULL);
			assert.equal(result.getImageHome(), registration.source.home);
			assert.equal(result.getRegistrationName(), registration.appName);
			assert.deepEqual(result.getUrlParameters(), new Map([
				["image", _IMAGE_NAME],
				["tag", _TAG]
			]));
			assert.deepEqual(result.getBody(), null);
		});
	});

	describe("Test scenarios for #createDockerLifecycleCommand", () => {

		const validLifecycleCommands = [
			{command: DockerCommand.START},
			{command: DockerCommand.STOP},
			{command: DockerCommand.RESTART},
			{command: DockerCommand.REMOVE}
		];

		const invalidLifecycleCommands = [
			{command: DockerCommand.PULL},
			{command: DockerCommand.CREATE_CONTAINER},
			{command: DockerCommand.IDENTIFY}
		];

		validLifecycleCommands.forEach(scenario => {

			it(`should create lifecycle request for valid lifecycle command=${scenario.command.name}`, () => {

				// given
				const registration = {
					appName: "testapp",
					source: {
						home: "localhost:10000"
					},
					execution: {
						commandName: "test-app"
					}
				};

				// when
				const result = dockerRequestFactory.createDockerLifecycleCommand(registration, scenario.command);

				// then
				assert.equal(result.getCommand(), scenario.command);
				assert.equal(result.getImageHome(), registration.source.home);
				assert.equal(result.getRegistrationName(), registration.appName);
				assert.deepEqual(result.getUrlParameters(), new Map([
					["id", registration.execution.commandName]
				]));
				assert.deepEqual(result.getBody(), null);
			});
		});

		invalidLifecycleCommands.forEach(scenario => {

			it(`should throw error on lifecycle request creation for invalid lifecycle command=${scenario.command.name}`, () => {

				// given
				const registration = {
					appName: "testapp"
				};

				try {

					// when
					dockerRequestFactory.createDockerLifecycleCommand(registration, scenario.command);

					assert.fail("Test case should have thrown Error");
				} catch (e) {

					// then
					// exception expected
				}
			});
		});
	});
});
