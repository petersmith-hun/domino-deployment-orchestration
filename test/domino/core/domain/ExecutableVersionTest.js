const assert = require('chai').assert;

import {describe, it} from "mocha";
import ExecutableVersion from "../../../../src/domino/core/domain/ExecutableVersion";

describe ("Unit tests for ExecutableVersion", () => {

	describe("Test scenarios for #constructor", () => {

		const scenarios = [
			{versionString: "1.0.0", expectedVersion: "1-0-0-"},
			{versionString: "1.9.2.5", expectedVersion: "1-9-2-5"},
			{versionString: "1.9.2_5", expectedVersion: "1-9-2-5"},
			{versionString: "1.9.2-build5", expectedVersion: "1-9-2-build5"},
			{versionString: "1.9.2_RC.1", expectedVersion: "1-9-2-RC_1"},
			{versionString: "1.9.2.5.7.4", expectedVersion: "1-9-2-5_7_4"},
			{versionString: "latest", expectedVersion: "latest---"},
		];

		scenarios.forEach(scenario => {
			it(`should parse versionString=${scenario.versionString}`, () => {

				// when
				const result = new ExecutableVersion(scenario.versionString);

				// then
				assert.equal(result.toString(), scenario.expectedVersion);
				assert.equal(result.getRawVersion(), scenario.versionString);
			});
		});
	});

	describe("Test scenarios for #compare", () => {

		const scenarios = [
			{versions: ["1.0.0", "2.0.0"], expectedCompareValue: -1},
			{versions: ["1.0.0", "1.0.0"], expectedCompareValue: 0},
			{versions: ["1.0.0.1-beta", "1.0.0.1-alpha"], expectedCompareValue: 1},
			{versions: ["1.0.0", "1.0.0.2"], expectedCompareValue: -1},
			{versions: ["20.0.0", "2.0.0.1"], expectedCompareValue: 1},
			{versions: ["20.0.0", "12.0.0.1"], expectedCompareValue: 1}
		];

		scenarios.forEach(scenario => {
			it(`Comparing versions=${scenario.versions}`, () => {

				// given
				const version1 = new ExecutableVersion(scenario.versions[0]);
				const version2 = new ExecutableVersion(scenario.versions[1]);

				// when
				const result = version1.compare(version2);

				// then
				assert.equal(result, scenario.expectedCompareValue);
			});
		})
	});
});
