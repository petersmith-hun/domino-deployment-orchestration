import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ConfigurationProvider from "../../../../../../src/domino/core/config/ConfigurationProvider";
import AbstractServiceAdapter from "../../../../../../src/domino/core/deployment/handler/service/AbstractServiceAdapter";
import ServiceAdapterRegistry
	from "../../../../../../src/domino/core/deployment/handler/service/ServiceAdapterRegistry";

describe("Unit tests for ServiceAdapterRegistry", () => {

	let configurationProviderMock = null;
	let serviceAdapterSystemdMock = null;
	let serviceAdapterEtcInitDMock = null;
	let serviceAdapterRegistry = null;

	beforeEach(() => {
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		serviceAdapterSystemdMock = sinon.createStubInstance(AbstractServiceAdapter);
		serviceAdapterEtcInitDMock = sinon.createStubInstance(AbstractServiceAdapter);

		serviceAdapterSystemdMock.serviceHandlerCompatibility.returns("systemd");
		serviceAdapterEtcInitDMock.serviceHandlerCompatibility.returns("initd");
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #_init", () => {

		it("should set 'initd' as service handler", () => {

			// given
			configurationProviderMock.getServiceHandler.returns("initd");

			// when
			serviceAdapterRegistry = new ServiceAdapterRegistry(configurationProviderMock,
				serviceAdapterSystemdMock, serviceAdapterEtcInitDMock);

			// then
			assert.equal(serviceAdapterRegistry.getServiceAdapter(), serviceAdapterEtcInitDMock);
		});

		it("should throw error on init in case of no service adapters", () => {

			// given
			configurationProviderMock.getServiceHandler.returns("initd", null);

			try {

				// when
				new ServiceAdapterRegistry(configurationProviderMock);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				// exception expected
				assert.equal(e.message, "No service handler has been specified, please check configuration value 'domino.service-handler'");
			}
		});

		it("should throw error on init in case of no suitable service adapter", () => {

			// given
			configurationProviderMock.getServiceHandler.returns("other");

			try {

				// when
				new ServiceAdapterRegistry(configurationProviderMock, serviceAdapterSystemdMock, serviceAdapterEtcInitDMock);

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				// exception expected
				assert.equal(e.message, "No service handler has been specified, please check configuration value 'domino.service-handler'");
			}
		});
	});
});
