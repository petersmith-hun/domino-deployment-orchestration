const API_VERSION = "v1.40";

/**
 * Docker Engine API request wrapper.
 */
export default class DockerRequest {

	constructor(dockerCommand, registration) {
		this._dockerCommand = dockerCommand;
		this._urlParameters = new Map();
		this._body = null;
		if (registration) {
			this._registrationName = registration.appName;
			this._imageHome = registration.source.home;
		}
	}

	/**
	 * Returns the assigned command descriptor.
	 * @see DockerCommand
	 *
	 * @returns DockerCommand the assigned command descriptor
	 */
	getCommand() {
		return this._dockerCommand;
	}

	/**
	 * Returns the registration's name or {@code null} if not specified.
	 *
	 * @returns {String|null} the registration's name or {@code null} if not specified
	 */
	getRegistrationName() {
		return this._registrationName || null;
	}

	/**
	 * Returns the registration's image home URI or {@code null} if not specified.
	 *
	 * @returns {String|null} the registration's image home URI or {@code null} if not specified
	 */
	getImageHome() {
		return this._imageHome || null;
	}

	/**
	 * Returns Map of the set URL parameters.
	 * Returns empty map if not populated.
	 *
	 * @returns {Map} containing the set URL parameters (or empty Map if none present)
	 */
	getUrlParameters() {
		return this._urlParameters;
	}

	/**
	 * Returns the set request body or {@code null} if not specified.
	 *
	 * @returns {*|null} request body object or {@code null}
	 */
	getBody() {
		return this._body;
	}

	/**
	 * Adds a new URL parameter to the parameter map.
	 * Multiple calls can be chained.
	 *
	 * @param key name of the URL parameter as specified in DockerCommand command descriptors.
	 * @param value value of the parameter
	 * @returns {DockerRequest} DockerRequest instance (fluent-like builder)
	 */
	addUrlParameter(key, value) {
		this._urlParameters.set(key, value);
		return this;
	}

	/**
	 * Sets the request body.
	 * Multiple calls can be chained.
	 *
	 * @param body any object that should be passed as request body
	 * @returns {DockerRequest} DockerRequest instance (fluent-like builder)
	 */
	setBody(body) {
		this._body = body;
		return this;
	}
}

/**
 * Docker Engine API response handler policies that determine how the response data should be processed.
 */
export const ResponseHandlerPolicy = Object.freeze({

	/**
	 * API returns a single line of data as JSON.
	 * The response should be returned by the client.
	 */
	SINGLE: {
		streamResponse: false,
		collectResponse: true
	},

	/**
	 * API returns multiple lines of data as JSON in SSE stream.
	 * The response can be dropped as no further processing is needed, but should be logged.
	 */
	LOG_ONLY_STREAM: {
		streamResponse: true,
		collectResponse: false
	},

	/**
	 * API returns multiple lines of data as JSON in SSE stream.
	 * Further processing of the response is needed, lines should be collected and returned by the client.
	 */
	LOG_AND_COLLECT_STREAM: {
		streamResponse: true,
		collectResponse: true
	}
});

/**
 * Docker Engine API command descriptors.
 * Each command must define the method and the path of the API endpoint to be called.
 * URL parameters should be specified between curly brackets.
 * Each command also must specify whether Docker Registry authentication is needed during the call and how the response should be handled.
 */
export const DockerCommand = Object.freeze({

	/**
	 * Docker Engine identification request.
	 */
	IDENTIFY: {
		name: "IDENTIFY",
		method: "GET",
		path: `/${API_VERSION}/version`,
		authRequired: false,
		responseHandlerPolicy: ResponseHandlerPolicy.SINGLE
	},

	/**
	 * Docker image pull request (from existing image in a Docker Registry).
	 * Must specify image name and tag as URL parameter in DockerRequest.
	 */
	PULL: {
		name: "PULL",
		method: "POST",
		path: `/${API_VERSION}/images/create?fromImage={image}&tag={tag}`,
		authRequired: true,
		responseHandlerPolicy: ResponseHandlerPolicy.LOG_ONLY_STREAM
	},

	/**
	 * Docker container creation request.
	 * Must specify container name as URL parameter in DockerRequest.
	 */
	CREATE_CONTAINER: {
		name: "CREATE_CONTAINER",
		method: "POST",
		path: `/${API_VERSION}/containers/create?name={name}`,
		authRequired: false,
		responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
	},

	/**
	 * Docker container start request.
	 * Must specify container ID/name as URL parameter in DockerRequest.
	 */
	START: {
		name: "START",
		method: "POST",
		path: `/${API_VERSION}/containers/{id}/start`,
		authRequired: false,
		responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
	},

	/**
	 * Docker container stop request.
	 * Must specify container ID/name as URL parameter in DockerRequest.
	 */
	STOP: {
		name: "STOP",
		method: "POST",
		path: `/${API_VERSION}/containers/{id}/stop`,
		authRequired: false,
		responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
	},

	/**
	 * Docker container restart request.
	 * Must specify container ID/name as URL parameter in DockerRequest.
	 */
	RESTART: {
		name: "RESTART",
		method: "POST",
		path: `/${API_VERSION}/containers/{id}/restart`,
		authRequired: false,
		responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
	},

	/**
	 * Docker container remove request.
	 * Must specify container ID/name as URL parameter in DockerRequest.
	 * Forced-stop manner is enforced so the call also stops the container before removing it.
	 */
	REMOVE: {
		name: "REMOVE",
		method: "DELETE",
		path: `/${API_VERSION}/containers/{id}?force=true`,
		authRequired: false,
		responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
	}
});
