import LoggerFactory from "../../../helper/LoggerFactory";
import DockerRequest, {DockerCommand} from "../../domain/DockerRequest";
import axios from "axios";

const logger = LoggerFactory.createLogger("DockerSocketClient");

/**
 * Docker Engine API client.
 *
 * This implementation uses the docker.sock API socket of Docker, therefore it can't be used with
 * an exposed daemon TCP endpoint.
 */
export default class DockerSocketClient {

	constructor(configurationProvider, dockerSocketResponseHandler) {
		this._dockerConfig = configurationProvider.getDockerConfig();
		this._dockerVersion = "Unidentified";
		this._dockerSocketResponseHandler = dockerSocketResponseHandler;
	}

	/**
	 * Forms a Docker Engine API request based on the given DockerRequest object and sends it to the Docker Engine.
	 *
	 * In case of unsuccessful identification the engine is most possibly inactive, therefore any further requests
	 * to the engine is unlikely to become successful (see #identifyDocker for identification process).
	 *
	 * @param dockerRequest DockerRequest object containing request parameters.
	 * @returns {Promise<unknown>} HTTP status code and the collected response as objects wrapped as Promise
	 */
	async executeDockerCommand(dockerRequest) {

		const command = dockerRequest.getCommand().name;
		const name = dockerRequest.getRegistrationName();
		const requestOptions = this._prepareDockerRequest(dockerRequest);

		logger.info(`Executing docker command=${command} for registration=${name}`);

		return new Promise(async (resolve, reject) => {

			try {
				this._dockerSocketResponseHandler.readDockerResponse({
					responseObject: await axios(requestOptions),
					dockerVersion: this._dockerVersion,
					responseHandlerPolicy: dockerRequest.getCommand().responseHandlerPolicy,
					commandName: command,
					registrationName: name,
					resolutionHandler: resolve,
					rejectionHandler: reject
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Forms a Docker Engine identification request and sends it to the Docker Engine.
	 * Upon success _dockerVersion field is populated with the identified engine version, otherwise version is set to "Unavailable".
	 * Further logs caused by communicating with the engine will contain the identified version.
	 */
	identifyDocker() {

		logger.info("[Docker Engine identification] Hello, Docker ...");

		this.executeDockerCommand(new DockerRequest(DockerCommand.IDENTIFY, null))
			.then(responseContext => {
				this._dockerVersion = responseContext.responseData.Version;
				const apiVersion = responseContext.responseData.ApiVersion;
				logger.info(`[Docker Engine identification] Hello, Domino, Docker v${this._dockerVersion} is running using API Version ${apiVersion}`);
			})
			.catch(reason => {
				logger.warn(`[Docker Engine identification] Docker is currently unavailable, reason=${reason.toString()}`);
				this._dockerVersion = "Unavailable";
			});
	}

	_prepareDockerRequest(dockerRequest) {
		return {
			method: dockerRequest.getCommand().method,
			socketPath: this._dockerConfig.socket,
			url: this._prepareURI(dockerRequest),
			data: dockerRequest.getBody(),
			validateStatus: false,
			responseType: dockerRequest.getCommand().responseHandlerPolicy.streamResponse
				? "stream"
				: "json",
			headers: {
				"Host": null,
				"X-Registry-Auth": this._prepareAuthHeader(dockerRequest)
			}
		};
	}

	_prepareURI(dockerRequest) {

		let uri = dockerRequest.getCommand().path;
		dockerRequest.getUrlParameters().forEach((value, key) => {
			uri = uri.replace(`{${key}}`, value);
		});

		return uri;
	}

	_prepareAuthHeader(dockerRequest) {

		let authHeader = null;
		if (dockerRequest.getCommand().authRequired && dockerRequest.getImageHome()) {

			const selectedServer = this._dockerConfig.servers
				.find((server) => dockerRequest.getImageHome().startsWith(server.host));

			if (selectedServer) {
				authHeader = Buffer.from(JSON.stringify({
					serveraddress: selectedServer.host,
					username: selectedServer.username,
					password: selectedServer.password
				})).toString("base64");
			} else {
				logger.warn(`Docker Registry credentials are not configured for registration=${dockerRequest.getRegistrationName()} at home=${dockerRequest.getImageHome()}`);
			}
		}

		return authHeader;
	}
}
