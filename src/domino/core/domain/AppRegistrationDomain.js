import ms from "ms";

const SOURCE_TYPES = ["FILESYSTEM"];
const EXECUTION_HANDLERS = ["EXECUTABLE", "RUNTIME", "SERVICE"];

/**
 * Domain class representing an application registration.
 */
export default class AppRegistration {

	constructor(appName, yamlSourceDocument) {
		this.appName = appName;
		this.source = new AppSource(yamlSourceDocument["source"]);
		this.runtime = yamlSourceDocument["runtime"];
		this.execution = new AppExecution(yamlSourceDocument["execution"]);
		this.healthCheck = new AppHealthCheck(yamlSourceDocument["health-check"]);
	}
}

/**
 * Domain class representing an application source descriptor.
 */
export class AppSource {

	constructor(yamlSourceDocumentSourceNode) {
		if (yamlSourceDocumentSourceNode) {
			this.type = AppSource.assertType(yamlSourceDocumentSourceNode["type"]);
			this.home = yamlSourceDocumentSourceNode["home"];
			this.resource = yamlSourceDocumentSourceNode["resource"];
		}
	}

	/**
	 * Checks if the provided source type is valid.
	 * Must be one of the values located in SOURCE_TYPES constant.
	 *
	 * @param type provided source type
	 * @returns provided source type or throws exception if it's invalid
	 */
	static assertType(type) {

		if (!SOURCE_TYPES.includes(type)) {
			throw new Error(`Invalid source type ${type}`);
		}

		return type;
	}
}

/**
 * Domain class representing an application execution descriptor.
 */
export class AppExecution {

	constructor(yamlSourceDocumentExecutionNode) {
		if (yamlSourceDocumentExecutionNode) {
			this.commandName = yamlSourceDocumentExecutionNode["command-name"];
			this.user = yamlSourceDocumentExecutionNode["as-user"];
			this.executionHandler = AppExecution.assertExecutionHandler(yamlSourceDocumentExecutionNode["via"]);
			this.args = yamlSourceDocumentExecutionNode["args"];
		}
	}

	/**
	 * Checks if the provided execution handler is valid.
	 * Must be one of the values located in EXECUTION_HANDLERS constant.
	 *
	 * @param executionHandler provided execution handler
	 * @returns provided execution handler or throws exception if it's invalid
	 */
	static assertExecutionHandler(executionHandler) {

		if (!EXECUTION_HANDLERS.includes(executionHandler)) {
			throw new Error(`Invalid execution handler ${executionHandler}`);
		}

		return executionHandler;
	}
}

/**
 * Domain class representing an application health-check descriptor.
 */
export class AppHealthCheck {

	constructor(yamlSourceDocumentExecutionNode) {
		if (yamlSourceDocumentExecutionNode) {
			this.enabled = yamlSourceDocumentExecutionNode["enabled"];
			this.delay = ms(yamlSourceDocumentExecutionNode["delay"]);
			this.timeout = ms(yamlSourceDocumentExecutionNode["timeout"]);
			this.maxAttempts = yamlSourceDocumentExecutionNode["max-attempts"];
			this.endpoint = yamlSourceDocumentExecutionNode["endpoint"];
		}
	}
}
