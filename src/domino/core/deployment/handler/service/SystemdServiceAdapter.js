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

	/**
	 * Starts the application as a Systemd compatible system service.
	 *
	 * @param serviceName app's service name
	 */
	start(serviceName) {
		this._executeCommand(serviceName, _COMMAND_START);
	}

	/**
	 * Stops the application as a Systemd compatible system service.
	 *
	 * @param serviceName app's service name
	 */
	stop(serviceName) {
		this._executeCommand(serviceName, _COMMAND_STOP);
	}

	/**
	 * Restarts the application as a Systemd compatible system service.
	 *
	 * @param serviceName app's service name
	 */
	restart(serviceName) {
		this._executeCommand(serviceName, _COMMAND_RESTART);
	}

	/**
	 * Returns 'systemd' as the compatible service handler.
	 *
	 * @returns {string} 'systemd', being the compatible service handler
	 */
	serviceHandlerCompatibility() {
		return _COMPATIBLE_SERVICE_HANDLER;
	}

	_executeCommand(serviceName, command) {

		if (!_AVAILABLE_SERVICE_COMMANDS.includes(command)) {
			throw Error(`Prohibited command=${command} called for service=${serviceName}`);
		}

		proc.execSync(`service ${serviceName} ${command}`);
	}
}
