import {afterEach, before, describe, it} from "mocha";
import {assert} from "chai";
import * as mockery from "mockery";

const _FAKE_CONFIG_ENTRY = {configKey: "value"};

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
		{configMethodReference: (configurationProvider) => configurationProvider.getSecurityConfig(), expectedConfigCall: "domino.auth"}
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

			mockery.deregisterAll();
			const mockConfig = {
				get: key => key === scenario.expectedConfigCall
					? _FAKE_CONFIG_ENTRY
					: assert.fail(`Passed configuration key should have been ${scenario.expectedConfigCall} but was ${key}`)
			};
			mockery.registerMock("config", mockConfig);

			return new (require("../../../../src/domino/core/config/ConfigurationProvider.js").default)();
		}
	});
});
