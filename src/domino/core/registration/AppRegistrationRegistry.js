import yaml from "js-yaml";
import fs from "fs";
import LoggerFactory from "../../helper/LoggerFactory";

const logger = LoggerFactory.createLogger("AppRegistrationRegistry");

/**
 * Component to handle application registrations by reading up the relevant section of configuration.
 * Registration configuration should be located in an external configuration file
 * (location should be specified under domino.registrations-path), under domino.registrations node.
 */
export default class AppRegistrationRegistry {

	constructor(registrationFactory, executorUserRegistry, runtimeRegistrationsFactory, configurationProvider) {
		this._registrationFactory = registrationFactory;
		this._runtimeRegistrationsFactory = runtimeRegistrationsFactory;
		this._registrationsConfigFile = configurationProvider.getRegistrationsFilePath();
		this._registrations = null;
		this._init();
		executorUserRegistry.registerExecutorUsers(this._registrations);
	}

	/**
	 * Returns list of the names of the registered applications.
	 *
	 * @returns array of the names of the registered application;
	 */
	getExistingRegistrations() {
		return Array.from(this._registrations.keys());
	}

	/**
	 * Returns registration configuration for the given application name.
	 *
	 * @param appName name of the application for the configuration to be retrieved
	 * @returns configuration registered for the given app, or throws error if it does not exist
	 */
	getRegistration(appName) {

		if (!this.getExistingRegistrations().includes(appName)) {
			throw new Error(`Requested application registration ${appName} does not exist`);
		}

		return this._registrations.get(appName);
	}

	/**
	 * Returns the registered runtime for the specified runtime name.
	 *
	 * @param runtimeName name of a registered runtime
	 * @returns registered runtime, or throws error if it does not exist
	 */
	getRuntime(runtimeName) {

		if (!Array.from(this._runtimes.keys()).includes(runtimeName)) {
			throw new Error(`Requested runtime ${runtimeName} does not exist`);
		}

		return this._runtimes.get(runtimeName);
	}

	_init() {
		logger.info(`Starting app registration with config file ${this._registrationsConfigFile}`);

		let registrationConfig = this._readRegistrations();
		this._registrations = this._registrationFactory.createRegistrations(registrationConfig);
		this._runtimes = this._runtimeRegistrationsFactory.createRuntimeRegistrations(registrationConfig);

		this._registrations.forEach((value, key) => logger.info(`Registered application ${key} with ${value.source.type}/${value.execution.executionHandler} source`));
		this._runtimes.forEach((value, key) => logger.info(`Runtime registered with name ${key}`));
	}

	_readRegistrations() {
		return yaml.safeLoad(fs.readFileSync(this._registrationsConfigFile));
	}
}