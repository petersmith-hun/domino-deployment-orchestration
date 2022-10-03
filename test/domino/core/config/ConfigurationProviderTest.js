import {afterEach, before, describe, it} from "mocha";
import {assert} from "chai";
import * as mockery from "mockery";
import {AuthorizationMode} from "../../../../src/domino/core/domain/AuthorizationMode";

const _FAKE_CONFIG_ENTRY = {configKey: "value"};
const _AUTH_MODE_KEY = "domino.auth.auth-mode";

describe("Unit tests for ConfigurationProvider", () => {

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

	const configurationGetterScenarios = [
		{configMethodReference: (configurationProvider) => configurationProvider.getServerConfiguration(), expectedConfigCall: "domino.server"},
		{configMethodReference: (configurationProvider) => configurationProvider.getStorageConfiguration(), expectedConfigCall: "domino.storage"},
		{configMethodReference: (configurationProvider) => configurationProvider.getRegistrationsFilePath(), expectedConfigCall: "domino.system.registrations-path"},
		{configMethodReference: (configurationProvider) => configurationProvider.getStartTimeout(), expectedConfigCall: "domino.system.spawn-control.start-timeout"},
		{configMethodReference: (configurationProvider) => configurationProvider.getServiceHandler(), expectedConfigCall: "domino.system.spawn-control.service-handler"},
		{configMethodReference: (configurationProvider) => configurationProvider.getSecurityConfig(), expectedConfigCall: "domino.auth"},
		{configMethodReference: (configurationProvider) => configurationProvider.getDockerConfig(), expectedConfigCall: "domino.docker"}
	];

	configurationGetterScenarios.forEach(scenario => {

		it(`should retrieve the proper config entry [${scenario.expectedConfigCall}]`, () => {

			// given
			const configurationProvider = _prepareMockedConfigurationProvider(scenario);

			// when
			const result = scenario.configMethodReference(configurationProvider);

			// then
			assert.isNotNull(result);
			assert.equal(result, _FAKE_CONFIG_ENTRY);
		});

		function _prepareMockedConfigurationProvider(scenario) {

			const mockConfig = {
				get: key => key === scenario.expectedConfigCall
					? _FAKE_CONFIG_ENTRY
					: assert.fail(`Passed configuration key should have been ${scenario.expectedConfigCall} but was ${key}`)
			};

			return _prepareConfigMock(mockConfig);
		}
	});

	it("should return return direct authorization mode as defined", () => {

		// given
		const configurationProvider = _prepareMockedConfigurationProviderForAuthModeTests("direct");

		// when
		const result = configurationProvider.getAuthorizationMode();

		// then
		assert.isNotNull(result);
		assert.equal(result, AuthorizationMode.DIRECT);
	});

	it("should return return oauth authorization mode as defined", () => {

		// given
		const configurationProvider = _prepareMockedConfigurationProviderForAuthModeTests("oauth");

		// when
		const result = configurationProvider.getAuthorizationMode();

		// then
		assert.isNotNull(result);
		assert.equal(result, AuthorizationMode.OAUTH);
	});

	it("should return return direct authorization mode as default", () => {

		// given
		const configurationProvider = _prepareMockedConfigurationProviderForAuthModeTests();

		// when
		const result = configurationProvider.getAuthorizationMode();

		// then
		assert.isNotNull(result);
		assert.equal(result, AuthorizationMode.DIRECT);
	});

	it("should return return direct authorization mode as fallback for invalid parameter", () => {

		// given
		const configurationProvider = _prepareMockedConfigurationProviderForAuthModeTests("invalid");

		// when
		const result = configurationProvider.getAuthorizationMode();

		// then
		assert.isNotNull(result);
		assert.equal(result, AuthorizationMode.DIRECT);
	});

	function _prepareMockedConfigurationProviderForAuthModeTests(authModeValue) {

		const mockConfig = {
			has: key => key === _AUTH_MODE_KEY
				? authModeValue !== undefined
				: assert.fail(`Passed configuration key should have been ${_AUTH_MODE_KEY} but was ${key}`),
			get: key => key === _AUTH_MODE_KEY
				? authModeValue
				: assert.fail(`Passed configuration key should have been ${_AUTH_MODE_KEY} but was ${key}`)
		};

		return _prepareConfigMock(mockConfig);
	}

	function _prepareConfigMock(configMockConfiguration) {

		mockery.deregisterAll();
		mockery.registerMock("config", configMockConfiguration);

		return new (require("../../../../src/domino/core/config/ConfigurationProvider.js").default)();
	}
});
