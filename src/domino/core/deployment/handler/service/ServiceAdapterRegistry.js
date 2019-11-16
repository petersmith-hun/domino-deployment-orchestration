import LoggerFactory from "../../../../helper/LoggerFactory";

const logger = LoggerFactory.createLogger('ServiceAdapterRegistry');

/**
 * Registry handling the supported service adapters.
 *
 * To select a service handler (depends on the OS used), 'domino.service-handler'
 * parameter should be specified in the default config.
 */
export default class ServiceAdapterRegistry {

	constructor(configurationProvider, ...serviceAdapterList) {

		this._serviceHandler = configurationProvider.getServiceHandler();
		this._init(serviceAdapterList);
	}

	/**
	 * Returns the selected service adapter implementation.
	 *
	 * @return {AbstractServiceAdapter} service adapter implementation
	 */
	getServiceAdapter() {
		return this._selectedServiceAdapter;
	}

	_init(serviceAdapterList) {

		if (!Array.isArray(serviceAdapterList)) {
			throw Error("Service adapter list should be an array");
		}

		this._selectedServiceAdapter = serviceAdapterList
			.find(adapter => adapter.serviceHandlerCompatibility().toLowerCase() === this._serviceHandler.toLowerCase());

		if (!this._selectedServiceAdapter) {
			throw Error("No service handler has been specified, please check configuration value 'domino.service-handler'");
		}

		logger.info(`ServiceHandler=${this._serviceHandler} will be used for service execution`);
	}
}