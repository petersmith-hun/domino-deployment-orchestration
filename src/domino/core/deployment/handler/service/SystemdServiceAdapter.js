import AbstractServiceAdapter from "./AbstractServiceAdapter";
import * as proc from "child_process";

const _COMMAND_START = "start";
const _COMMAND_STOP = "stop";
const _COMMAND_RESTART = "restart";
const _AVAILABLE_SERVICE_COMMANDS = [_COMMAND_START, _COMMAND_STOP, _COMMAND_RESTART];
const _COMPATIBLE_SERVICE_HANDLER = "systemd";

/**
 * AbstractServiceAdapter implementation using Debian Systemd service calls for service lifecycle management.
 */
export default class SystemdServiceAdapter extends AbstractServiceAdapter {

	start(serviceName) {
		this._executeCommand(serviceName, _COMMAND_START);
	}

	stop(serviceName) {
		this._executeCommand(serviceName, _COMMAND_STOP);
	}

	restart(serviceName) {
		this._executeCommand(serviceName, _COMMAND_RESTART);
	}

	serviceHandlerCompatibility() {
		return _COMPATIBLE_SERVICE_HANDLER;
	}

	_executeCommand(serviceName, command) {

		if (!(command in _AVAILABLE_SERVICE_COMMANDS)) {
			throw Error(`Prohibited command=${command} called for service=${serviceName}`);
		}

		proc.execSync(`service ${serviceName} ${command}`);
	}
}
