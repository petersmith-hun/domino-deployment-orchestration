import {afterEach, describe, it} from "mocha";
import * as mockery from "mockery";
import {assert} from "chai";
import {InfoStatus} from "../../../../../src/domino/core/domain/InfoStatus";

const _DISABLED_INFO_ENDPOINT_REGISTRATION = {appInfo: {enabled: false}};
const _ENABLED_INFO_ENDPOINT_REGISTRATION = {
	appInfo: {
		enabled: true,
		endpoint: "http://localhost:8000/info",
		fieldMapping: {
			version: "$.build.version",
			name: "$.app.name"
		}
	}
}
const _INFO_ENDPOINT_RESPONSE = {
	statusCode: 200,
	body: {
		build: {
			version: "1.0.0"
		},
		app: {
			name: "Test app"
		}
	}
};
const _INFO_ENDPOINT_RESPONSE_MISSING_VERSION = {
	statusCode: 200,
	body: {
		app: {
			name: "Test app"
		}
	}
};
const _INFO_ENDPOINT_RESPONSE_MULTIPLE_NAME = {
	statusCode: 200,
	body: {
		build: {
			version: "1.0.0"
		},
		app: [{
			name: "Name 1"
		}, {
			name: "Name 2"
		}]
	}
};

describe("Unit tests for InfoProvider", () => {

	let requestOptionsParameterValue = null;
	let infoProvider = null;

	beforeEach(() => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		});
	});

	afterEach(() => {
		mockery.resetCache();
		requestOptionsParameterValue = null;
	});

	describe("Test scenarios for #getAppInfo", () => {

		it("should instantly resolve with non-configured status on disabled info endpoint", async () => {

			// given
			infoProvider = _prepareMockedInfoProvider({});

			// when
			const result = await infoProvider.getAppInfo(_DISABLED_INFO_ENDPOINT_REGISTRATION);

			// then
			assert.deepEqual(result, {
				status: InfoStatus.NON_CONFIGURED
			})
		});

		it("should return provided info on configured endpoint and successful response", async () => {

			// given
			infoProvider = _prepareMockedInfoProvider(_INFO_ENDPOINT_RESPONSE);

			// when
			const result = await infoProvider.getAppInfo(_ENABLED_INFO_ENDPOINT_REGISTRATION);

			// then
			assert.deepEqual(requestOptionsParameterValue, {
				method: "GET",
				uri: _ENABLED_INFO_ENDPOINT_REGISTRATION.appInfo.endpoint,
				json: true,
				resolveWithFullResponse: true,
				simple: false
			})
			assert.deepEqual(result, {
				status: InfoStatus.PROVIDED,
				info: {
					version: _INFO_ENDPOINT_RESPONSE.body.build.version,
					name: _INFO_ENDPOINT_RESPONSE.body.app.name
				}
			})
		});

		it("should return misconfigured status on configured endpoint and deficient response", async () => {

			// given
			infoProvider = _prepareMockedInfoProvider(_INFO_ENDPOINT_RESPONSE_MISSING_VERSION);

			// when
			const result = await infoProvider.getAppInfo(_ENABLED_INFO_ENDPOINT_REGISTRATION);

			// then
			assert.deepEqual(result, {
				status: InfoStatus.MISCONFIGURED,
				info: {
					name: _INFO_ENDPOINT_RESPONSE.body.app.name
				}
			})
		});

		it("should return misconfigured status on configured endpoint and malformed response", async () => {

			// given
			infoProvider = _prepareMockedInfoProvider(_INFO_ENDPOINT_RESPONSE_MULTIPLE_NAME);

			// when
			const result = await infoProvider.getAppInfo(_ENABLED_INFO_ENDPOINT_REGISTRATION);

			// then
			assert.deepEqual(result, {
				status: InfoStatus.MISCONFIGURED,
				info: {
					version: _INFO_ENDPOINT_RESPONSE.body.build.version
				}
			})
		});

		it("should return misconfigured status on configured endpoint and non-200 response", async () => {

			// given
			infoProvider = _prepareMockedInfoProvider({statusCode: 404});

			// when
			const result = await infoProvider.getAppInfo(_ENABLED_INFO_ENDPOINT_REGISTRATION);

			// then
			assert.deepEqual(result, {
				status: InfoStatus.MISCONFIGURED
			})
		});

		it("should return failed status on configured endpoint but failed request", async () => {

			// given
			infoProvider = _prepareMockedRejectingInfoProvider();

			// when
			const result = await infoProvider.getAppInfo(_ENABLED_INFO_ENDPOINT_REGISTRATION);

			// then
			assert.deepEqual(result, {
				status: InfoStatus.FAILED
			})
		});
	});

	function _prepareMockedInfoProvider(rpResponse) {

		mockery.deregisterAll();
		mockery.registerMock("request-promise", (requestOptions) => {
			requestOptionsParameterValue = requestOptions
			return Promise.resolve(rpResponse);
		});

		return new (require("../../../../../src/domino/core/deployment/info/InfoProvider").default)();
	}

	function _prepareMockedRejectingInfoProvider() {

		mockery.deregisterAll();
		mockery.registerMock("request-promise", () => {
			return Promise.reject({
				message: "Rejecting test case"
			});
		});

		return new (require("../../../../../src/domino/core/deployment/info/InfoProvider").default)();
	}
});
