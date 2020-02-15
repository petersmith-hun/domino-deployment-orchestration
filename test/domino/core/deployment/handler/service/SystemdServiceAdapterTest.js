import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import child_process from "child_process";
import SystemdServiceAdapter from "../../../../../../src/domino/core/deployment/handler/service/SystemdServiceAdapter";

const _SERVICE_NAME = "app-svc";

describe("Unit tests for SystemdServiceAdapter", () => {

	let systemdServiceAdapter = null;

	beforeEach(() => {
		systemdServiceAdapter = new SystemdServiceAdapter();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #start", () => {

		it("should call service with start command", () => {

			// given
			const procFake = sinon.fake();
			sinon.replace(child_process, "execSync", procFake);

			// when
			systemdServiceAdapter.start(_SERVICE_NAME);

			// then
			sinon.assert.calledWith(procFake, "service app-svc start");
		});
	});

	describe("Test scenarios for #stop", () => {

		it("should call service with stop command", () => {

			// given
			const procFake = sinon.fake();
			sinon.replace(child_process, "execSync", procFake);

			// when
			systemdServiceAdapter.stop(_SERVICE_NAME);

			// then
			sinon.assert.calledWith(procFake, "service app-svc stop");
		});
	});

	describe("Test scenarios for #restart", () => {

		it("should call service with restart command", () => {

			// given
			const procFake = sinon.fake();
			sinon.replace(child_process, "execSync", procFake);

			// when
			systemdServiceAdapter.restart(_SERVICE_NAME);

			// then
			sinon.assert.calledWith(procFake, "service app-svc restart");
		});
	});

	describe("Test scenarios for #serviceHandlerCompatibility", () => {

		it("should return 'systemd'", () => {

			// when
			const result = systemdServiceAdapter.serviceHandlerCompatibility();

			// then
			assert.equal(result, "systemd");
		});
	});


	describe("Test scenarios for #_executeCommand", () => {

		it("should throw error in case of prohibited command", () => {

			// given
			const procFake = sinon.fake();
			sinon.replace(child_process, "execSync", procFake);

			try {

				// when
				systemdServiceAdapter._executeCommand(_SERVICE_NAME, "some-command");

				assert.fail("Test case should have thrown error");
			} catch (e) {

				// then
				// exception expected
				assert.isFalse(procFake.called);
			}
		});
	});
});
