import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import yaml from "js-yaml";
import fs from "fs";
import AppRegistrationsFactory from "../../../../src/domino/core/registration/AppRegistrationsFactory";
import ExecutorUserRegistry from "../../../../src/domino/core/registration/ExecutorUserRegistry";
import RuntimeRegistrationsFactory from "../../../../src/domino/core/registration/RuntimeRegistrationsFactory";
import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import AppRegistrationRegistry from "../../../../src/domino/core/registration/AppRegistrationRegistry";

const _REGISTRATIONS_FILE_PATH = "/tmp/domino_registrations.yml";
const _CONFIG_FILE_CONTENT = "config-file-content";
const _CONFIG_OBJECT = {
	domino: {
		registrations: new Map(),
		runtimes: new Map()
	}
};
_CONFIG_OBJECT.domino.registrations.set("leaflet", {
	source: {
		type: "EXECUTABLE"
	},
	execution: {
		executionHandler: "RUNTIME"
	}
});
_CONFIG_OBJECT.domino.runtimes.set("java", {});

describe("Unit tests for AppRegistrationRegistry", () => {

	let registrationFactoryMock = null;
	let executorUserRegistryMock = null;
	let runtimeRegistrationsFactory = null;
	let configurationProviderMock = null;
	let appRegistrationRegistry = null;

	beforeEach(() => {
		registrationFactoryMock = sinon.createStubInstance(AppRegistrationsFactory);
		executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
		runtimeRegistrationsFactory = sinon.createStubInstance(RuntimeRegistrationsFactory);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		configurationProviderMock.getRegistrationsFilePath.returns(_REGISTRATIONS_FILE_PATH);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #_init", () => {

		it("should properly init the registry", () => {

			// given
			_prepareMocks();

			// when
			appRegistrationRegistry = new AppRegistrationRegistry(registrationFactoryMock, executorUserRegistryMock,
				runtimeRegistrationsFactory, configurationProviderMock);

			// then
			assert.equal(appRegistrationRegistry._registrations.size, 1);
			assert.equal(appRegistrationRegistry._registrations.get("leaflet"), _CONFIG_OBJECT.domino.registrations.get("leaflet"));
			assert.equal(appRegistrationRegistry._runtimes.size, 1);
			assert.equal(appRegistrationRegistry._runtimes.get("java"), _CONFIG_OBJECT.domino.runtimes.get("java"));
		});
	});

	describe("Test scenarios for #getExistingRegistrations", () => {

		it("should return all registered apps", () => {

			// given
			_prepareMocks();
			appRegistrationRegistry = new AppRegistrationRegistry(registrationFactoryMock, executorUserRegistryMock,
				runtimeRegistrationsFactory, configurationProviderMock);

			// when
			const result = appRegistrationRegistry.getExistingRegistrations();

			// then
			assert.deepEqual(result, ["leaflet"]);
		});
	});

	describe("Test scenarios for #getRegistration", () => {

		it("should return registered app", () => {

			// given
			_prepareMocks();
			appRegistrationRegistry = new AppRegistrationRegistry(registrationFactoryMock, executorUserRegistryMock,
				runtimeRegistrationsFactory, configurationProviderMock);

			// when
			const result = appRegistrationRegistry.getRegistration("leaflet");

			// then
			assert.equal(result, _CONFIG_OBJECT.domino.registrations.get("leaflet"));
		});

		it("should should error on retrieving non existing registration", () => {

			// given
			_prepareMocks();
			appRegistrationRegistry = new AppRegistrationRegistry(registrationFactoryMock, executorUserRegistryMock,
				runtimeRegistrationsFactory, configurationProviderMock);

			try {

				// when
				appRegistrationRegistry.getRegistration("app");

				assert.fail("Test scenario should have thrown exception");
			} catch (e) {

				// then
				// exception expected
				assert.equal(e.message, `Requested application registration app does not exist`);
			}
		});
	});

	describe("Test scenarios for #getRuntime", () => {

		it("should return registered runtime", () => {

			// given
			_prepareMocks();
			appRegistrationRegistry = new AppRegistrationRegistry(registrationFactoryMock, executorUserRegistryMock,
				runtimeRegistrationsFactory, configurationProviderMock);

			// when
			const result = appRegistrationRegistry.getRuntime("java");

			// then
			assert.equal(result, _CONFIG_OBJECT.domino.runtimes.get("java"));
		});

		it("should should error on retrieving non existing runtime", () => {

			// given
			_prepareMocks();
			appRegistrationRegistry = new AppRegistrationRegistry(registrationFactoryMock, executorUserRegistryMock,
				runtimeRegistrationsFactory, configurationProviderMock);

			try {

				// when
				appRegistrationRegistry.getRuntime("python");

				assert.fail("Test scenario should have thrown exception");
			} catch (e) {

				// then
				// exception expected
				assert.equal(e.message, `Requested runtime python does not exist`);
			}
		});
	});

	function _prepareMocks() {
		sinon.stub(fs, "readFileSync").callsFake((argument) => {

			if (argument !== _REGISTRATIONS_FILE_PATH) {
				assert.fail(`fs#readFileSync should have been called with ${_REGISTRATIONS_FILE_PATH} argument`);
			}

			return _CONFIG_FILE_CONTENT;
		});
		sinon.stub(yaml, "safeLoad").callsFake((argument) => {

			if (argument !== _CONFIG_FILE_CONTENT) {
				assert.fail(`yaml#safeLoad should have been called with '${_CONFIG_FILE_CONTENT}' argument`);
			}

			return _CONFIG_OBJECT;
		});
		registrationFactoryMock.createRegistrations.withArgs(_CONFIG_OBJECT).returns(_CONFIG_OBJECT.domino.registrations);
		runtimeRegistrationsFactory.createRuntimeRegistrations.withArgs(_CONFIG_OBJECT).returns(_CONFIG_OBJECT.domino.runtimes);
	}
});
