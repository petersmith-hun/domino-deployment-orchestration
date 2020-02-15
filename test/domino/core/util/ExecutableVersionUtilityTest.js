import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ConfigurationProvider from "../../../../src/domino/core/config/ConfigurationProvider";
import ExecutableVersionUtility from "../../../../src/domino/core/util/ExecutableVersionUtility";
import fs from "fs";

const _STORAGE_CONFIG = {
	path: "/tmp/storage"
};

describe("Unit tests for ExecutableVersionUtility", () => {

	let configurationProviderMock = null;
	let executableVersionUtility = null;

	beforeEach(() => {
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);

		configurationProviderMock.getStorageConfiguration.returns(_STORAGE_CONFIG);

		executableVersionUtility = new ExecutableVersionUtility(configurationProviderMock);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #findLatestVersion", () => {

		const storedFilesMock = [
			"executable-leaflet-v1.0.2.24.jar",
			"executable-leaflet-v1.1.0.25.jar",
			"executable-leaflet-v1.10.0.50.jar",
			"executable-leaflet-v1.4.0.30.jar",
			"executable-tlp-v1.2.0.10.jar",
			"executable-tlp-v1.4.1.25.jar",
			"executable-lms.jar",
			"executable-lms-v.jar",
			"unrelated-file.exe",
			"random-config-file.conf"
		];

		const latestVersionScenarios = [
			{app: "leaflet", expectedVersion: "1.10.0.50"},
			{app: "tlp", expectedVersion: "1.4.1.25"},
			{app: "tms", expectedVersion: null},
			{app: "lms", expectedVersion: null}
		];

		latestVersionScenarios.forEach(scenario => {

			it(`should return latest version of specified application [${scenario.app} -> ${scenario.expectedVersion}]`, () => {

				// given
				const fsFake = sinon.fake.returns(storedFilesMock);
				sinon.replace(fs, "readdirSync", fsFake);

				// when
				const result = executableVersionUtility.findLatestVersion(scenario.app);

				// then
				sinon.assert.calledWith(fsFake, _STORAGE_CONFIG.path);
				if (scenario.expectedVersion === null) {
					assert.isNull(result);
				} else {
					assert.equal(result.getFormattedVersion(), scenario.expectedVersion);
				}
			});
		});
	});
});
