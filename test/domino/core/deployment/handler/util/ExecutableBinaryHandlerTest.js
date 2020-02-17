import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";

import ExecutableBinaryHandler from "../../../../../../src/domino/core/deployment/handler/util/ExecutableBinaryHandler";
import {ChildProcessTemplate} from "../../../../testutils/TestUtils";
import child_process from "child_process";
import {DeploymentStatus} from "../../../../../../src/domino/core/domain/DeploymentStatus";
import process_list from "process-list";

const _REGISTRATION = {
	appName: "app",
	source: {
		resource: "app-v1.jar"
	}
};

describe("Unit tests for ExecutableBinaryHandler", () => {

	let childProcessMock = null;
	let executableBinaryHandler = null;

	beforeEach(() => {
		childProcessMock = sinon.createStubInstance(ChildProcessTemplate);

		executableBinaryHandler = new ExecutableBinaryHandler();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #spawnProcess", () => {

		it("should prepare spawn parameters correctly", async () => {

			// given
			const spawnFake = sinon.fake.returns(childProcessMock);
			sinon.replace(child_process, "spawn", spawnFake);
			const spawnParameters = {
				executablePath: "/tmp/app.jar",
				workDirectory: "/tmp",
				args: ["arg1", "arg2"],
				userID: 12
			};

			// when
			await executableBinaryHandler.spawnProcess(spawnParameters);

			// then
			sinon.assert.calledWith(spawnFake, spawnParameters.executablePath, spawnParameters.args, {
				uid: spawnParameters.userID,
				cwd: spawnParameters.workDirectory,
				detached: true,
				stdio: "ignore"});
			sinon.assert.calledWith(childProcessMock.on, "error");
		});
	});

	describe("Test scenarios for #killProcess", () => {

		it("should kill process by passed process object", async () => {

			// given
			const runningProcess = {pid: 5123456};
			const processFake = sinon.fake();
			sinon.replace(process, "kill", processFake);

			// when
			const result = await executableBinaryHandler.killProcess(runningProcess, {});

			// then
			assert.equal(result, DeploymentStatus.STOPPED);
			assert.equal(processFake.lastArg, -runningProcess.pid);
		});

		it("should fail to kill process by passed process object", async () => {

			// given
			const runningProcess = {pid: 5123456};
			const processFake = sinon.fake.throws(new Error("process.kill failed"));
			sinon.replace(process, "kill", processFake);

			// when
			const result = await executableBinaryHandler.killProcess(runningProcess, {});

			// then
			assert.equal(result, DeploymentStatus.STOP_FAILURE);
			assert.equal(processFake.lastArg, -runningProcess.pid);
		});

		it("should find process by its resource name and kill it", async () => {

			// given
			const processFake = sinon.fake();
			sinon.replace(process, "kill", processFake);
			sinon.replace(process_list, "snapshot", _prepareSnapshotFake(true));

			// when
			const result = await executableBinaryHandler.killProcess(null, _REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.STOPPED);
			assert.equal(processFake.lastArg, -5123452);
		});

		it("should not find process by its resource name and resolve with UNKNOWN_STOPPED", async () => {

			// given
			const processFake = sinon.fake();
			sinon.replace(process, "kill", processFake);
			sinon.replace(process_list, "snapshot", _prepareSnapshotFake(false));

			// when
			const result = await executableBinaryHandler.killProcess(null, _REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.UNKNOWN_STOPPED);
			assert.isFalse(processFake.called);
		});

		it("should process list request fail and resolve with STOP_FAILURE", async () => {

			// given
			const processFake = sinon.fake();
			sinon.replace(process, "kill", processFake);
			sinon.replace(process_list, "snapshot", sinon.fake.rejects(new Error("process list request failure")));

			// when
			const result = await executableBinaryHandler.killProcess(null, _REGISTRATION);

			// then
			assert.equal(result, DeploymentStatus.STOP_FAILURE);
			assert.isFalse(processFake.called);
		});

		function _prepareSnapshotFake(includeTargetProcess) {

			const processList = [
				{pid: 5123450, cmdline: "java -jar not-this-app.jar"},
				{pid: 5123451, cmdline: "kernel"},
				{pid: 5123453, cmdline: "some-other-binary"}
			];

			if (includeTargetProcess) {
				processList.push({pid: 5123452, cmdline: "java -jar -Dsome=value app-v1.jar --spring.profiles.active=prod"});
			}

			return sinon.fake.resolves(processList);
		}
	});
});
