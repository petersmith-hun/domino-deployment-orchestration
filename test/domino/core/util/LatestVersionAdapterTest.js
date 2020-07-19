import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";
import AppRegistrationRegistry from "../../../../src/domino/core/registration/AppRegistrationRegistry";
import ExecutableVersionUtility from "../../../../src/domino/core/util/ExecutableVersionUtility";
import LatestVersionAdapter from "../../../../src/domino/core/util/LatestVersionAdapter";
import ExecutableVersion from "../../../../src/domino/core/domain/ExecutableVersion";

const _APP = "testapp";

describe("Unit tests for LatestVersionAdapter", () => {

	let appRegistrationRegistryMock = null;
	let executableVersionUtilityMock = null;
	let latestVersionAdapter = null;

	beforeEach(() => {
		appRegistrationRegistryMock = sinon.createStubInstance(AppRegistrationRegistry);
		executableVersionUtilityMock = sinon.createStubInstance(ExecutableVersionUtility);

		latestVersionAdapter = new LatestVersionAdapter(appRegistrationRegistryMock, executableVersionUtilityMock);
	});

	describe("Test scenarios for #determineLatestVersion", () => {

		it("should immediately return latest version constant for Docker-based app", () => {

			// given
			appRegistrationRegistryMock.getRegistration.withArgs(_APP).returns(_prepareRegistration("DOCKER"));

			// when
			const result = latestVersionAdapter.determineLatestVersion(_APP);

			// then
			assert.equal(result.getRawVersion(), "latest");
		});

		it("should call executableVersionUtility to determine latest version for filesystem-based app", () => {

			// given
			const expectedVersion = new ExecutableVersion("1.2.3");
			appRegistrationRegistryMock.getRegistration.withArgs(_APP).returns(_prepareRegistration("FILESYSTEM"));
			executableVersionUtilityMock.findLatestVersion.withArgs(_APP).returns(expectedVersion);

			// when
			const result = latestVersionAdapter.determineLatestVersion(_APP);

			// then
			assert.equal(result, expectedVersion);
		});
	});

	function _prepareRegistration(sourceType) {
		return {
			source: {
				type: sourceType
			}
		}
	}
});
