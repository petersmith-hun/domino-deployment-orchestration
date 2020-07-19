import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import DockerCreateContainerRequestMapper
	from "../../../../../src/domino/core/deployment/docker/DockerCreateContainerRequestMapper";

describe("Unit tests for DockerCreateContainerRequestMapper", () => {

	let dockerCreateContainerRequestMapper = null;

	beforeEach(() => {
		dockerCreateContainerRequestMapper = new DockerCreateContainerRequestMapper();
	});

	describe("Test scenarios for #prepareContainerCreationRequest", () => {

		it("should convert populated configuration to request", () => {

			// given
			const registration = {
				execution: {
					args: {
						"restart-policy": "unless-stopped",
						"network-mode": "host",
						environment: {
							ENV_PARAM_1: "value1",
							ENV_PARAM_2: "value2"
						},
						"command-args": [
							"--spring.profiles.active=production",
							"--spring.config.location=/app/config/appconfig_leaflet.yml"
						],
						volumes: {
							"/app/conf": "/config:ro",
							"/app/leaflet-storage": "/storage:rw"
						},
						ports: {
							"9082": "9082/tcp"
						}
					}
				}
			};

			// when
			const result = dockerCreateContainerRequestMapper.prepareContainerCreationRequest(registration);

			// then
			assert.deepEqual(result, {
				"Cmd": [
					"--spring.profiles.active=production",
					"--spring.config.location=/app/config/appconfig_leaflet.yml"
				],
				"Env": [
					"ENV_PARAM_1=value1",
					"ENV_PARAM_2=value2"
				],
				"Volumes": {
					"/config": {},
					"/storage": {}
				},
				"ExposedPorts": {
					"9082/tcp": {}
				},
				"HostConfig": {
					"Binds": [
						"/app/conf:/config:ro",
						"/app/leaflet-storage:/storage:rw"
					],
					"NetworkMode": "host",
					"PortBindings": {
						"9082/tcp": [{
							"HostPort": "9082"
						}]
					},
					"RestartPolicy": {
						"Name": "unless-stopped"
					}
				}
			});
		});

		it("should convert empty configuration", () => {

			// given
			const registration = {
				execution: {
					args: {}
				}
			};

			// when
			const result = dockerCreateContainerRequestMapper.prepareContainerCreationRequest(registration);

			// then
			assert.deepEqual(result, {});
		});
	});
});
