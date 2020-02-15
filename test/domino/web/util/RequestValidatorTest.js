import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";

import RequestValidator from "../../../../src/domino/web/util/RequestValidator";
import InvalidRequestError from "../../../../src/domino/web/error/InvalidRequestError";

describe("Unit tests for RequestValidator", () => {

	let requestValidator = null;

	beforeEach(() => {
		requestValidator = new RequestValidator();
	});

	describe("Test scenarios for #isUploadRequestValid", () => {

		_getBaseScenarios().forEach(scenario => {
			it(`should return the proper validation result [app=${scenario.app} version=${scenario.version}] -> valid=${scenario.expectedValidationResult}`, () => {

				// given
				const requestParameters = _prepareRequestParameters(scenario);

				// when
				const result = requestValidator.isUploadRequestValid(requestParameters);

				// then
				assert.equal(result, scenario.expectedValidationResult);
			});
		});
	});

	describe("Test scenarios for #isLifecycleRequestValid", () => {

		const scenarios = _getBaseScenarios();
		scenarios.push({app: "app", version: undefined, expectedValidationResult: true});

		scenarios.forEach(scenario => {
			it(`should return the proper validation result [app=${scenario.app} version=${scenario.version}] -> valid=${scenario.expectedValidationResult}`, () => {

				// given
				const requestParameters = _prepareRequestParameters(scenario);

				// when
				const result = requestValidator.isLifecycleRequestValid(requestParameters);

				// then
				assert.equal(result, scenario.expectedValidationResult);
			});
		});
	});

	describe("Test scenarios for #assertValidDeploymentRequest", () => {

		_getBaseScenarios().forEach(scenario => {
			it(`should throw error for invalid cases [app=${scenario.app} version=${scenario.version}] -> valid=${scenario.expectedValidationResult}`, () => {

				// given
				const requestParameters = _prepareRequestParameters(scenario);

				try {

					// when
					requestValidator.assertValidDeploymentRequest(requestParameters);

					// then
					if (!scenario.expectedValidationResult) {
						assert.fail("Test case should have thrown error");
					}

				} catch (e) {
					if (!(e instanceof InvalidRequestError)) {
						assert.fail("Error should have been instance of InvalidRequestError");
					}

					if (scenario.expectedValidationResult) {
						assert.fail("Test case should have not thrown error");
					}
				}
			});
		});
	});

	function _prepareRequestParameters(scenario) {

		const requestParameters = {};
		if (scenario.app !== undefined) {
			requestParameters.app = scenario.app;
		}
		if (scenario.version !== undefined) {
			requestParameters.version = scenario.version;
		}

		return requestParameters;
	}

	function _getBaseScenarios() {
		return [
			{app: undefined, version: undefined, expectedValidationResult: false},
			{app: null, version: null, expectedValidationResult: false},
			{app: "app1", version: undefined, expectedValidationResult: false},
			{app: "app1", version: null, expectedValidationResult: false},
			{app: "./etc", version: null, expectedValidationResult: false},
			{app: "app", version: "/1/2/3", expectedValidationResult: false},
			{app: "app", version: "1.2.0", expectedValidationResult: true},
			{app: "app", version: "1.2.0.4", expectedValidationResult: true},
			{app: "app", version: "1.2.0_build1", expectedValidationResult: true},
			{app: "app", version: "1.2.0-build.2", expectedValidationResult: true},
			{app: "app", version: "1.2.0-alpha", expectedValidationResult: true}
		];
	}
});
