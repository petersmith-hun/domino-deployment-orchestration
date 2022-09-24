import LoggerFactory from "../../../helper/LoggerFactory";
import {ResponseHandlerPolicy} from "../../domain/DockerRequest";

const logger = LoggerFactory.createLogger("DockerSocketResponseHandler");

/**
 * Response handler logic for Docker Engine API calls.
 */
export default class DockerSocketResponseHandler {

	/**
	 * Handles response made via 'Axios' library to the Docker Engine API.
	 * Logic defines four handlers for the different states of responses:
	 *  - response: first response of the engine, containing generic information about the call results (e.g. status code)
	 *  - data: returned data chunk as JSON string (or multiple JSON strings separated by LF symbol)
	 *  - error: request failure (e.g. host unavailable)
	 *  - end: indicates closing the request
	 *
	 * 'Data' handling can happen in 3 ways (always expecting JSON):
	 *  - ResponseHandlerPolicy.SINGLE: handle a single line of response
	 *  - ResponseHandlerPolicy.LOG_ONLY_STREAM: handle multiple lines of response in a streaming manner, only logs them
	 *  - ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM: handle multiple lines of response in a streaming manner, logs and collects them in the response context
	 *
	 * The logic writes the collected response in a response context object, and returns the result in 'end' event by calling the passed
	 * Promise resolution method. In case of error, the passed Promise rejection method is called with the response context.
	 *
	 * @param requestContext contains the necessary parameters for handling a response:
	 *  - responseObject: result of the 'request' call
	 *  - dockerVersion: identified Docker Engine version (for logging purposes)
	 *  - responseHandlerPolicy: see above
	 *  - commandName: name of the Docker command being executed (for logging purposes)
	 *  - registrationName: name of the registration for which the command is being executed (for logging purposes)
	 *  - resolutionHandler: Promise 'resolve' method
	 *  - rejectionHandler: Promise 'reject' method
	 */
	readDockerResponse(requestContext) {

		const responseContext = {
			requestError: false,
			responseData: requestContext.responseHandlerPolicy === ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
				? []
				: null
		};

		if (requestContext.responseObject.status < 500) {
			this._responseHandler(requestContext, responseContext, requestContext.responseObject);
		} else {
			this._errorHandler(requestContext, responseContext, requestContext.responseObject);
		}
	}

	_responseHandler(requestContext, responseContext, response) {

		responseContext.statusCode = response.status;
		responseContext.streamingResult = requestContext.responseHandlerPolicy.streamResponse;
		logger.info(`Response received from Docker Engine for command=${requestContext.commandName} on registration=${requestContext.registrationName}, statusCode=${response.status}`);

		this._processData(requestContext, responseContext, requestContext.responseObject.data);
	}

	_processData(requestContext, responseContext, data) {

		if (requestContext.responseHandlerPolicy.streamResponse) {
			data
				.on("data", (line) => this._parseDataLine(line)
					.forEach((item) => this._processDataItem(requestContext, responseContext, item)))
				.on("end", () => this._endHandler(requestContext, responseContext));
		} else {
			this._processDataItem(requestContext, responseContext, data);
			this._endHandler(requestContext, responseContext);
		}
	}

	_processDataItem(requestContext, responseContext, item) {

		logger.info(`Docker ${requestContext.dockerVersion} | ${requestContext.registrationName} | ${JSON.stringify(item)}`);

		if (requestContext.responseHandlerPolicy.collectResponse) {
			if (requestContext.responseHandlerPolicy.streamResponse) {
				responseContext.responseData.push(item);
			} else {
				responseContext.responseData = item;
			}
		}
	}

	_parseDataLine(line) {

		return Buffer.from(line)
			.toString("utf8")
			.trim()
			.split("\n")
			.map((item) => {
				try {
					return JSON.parse(item);
				} catch (error) {
					logger.error(`Failed to parse item=${item} as JSON object - ${error.message}`);
				}
			});
	}

	_errorHandler(requestContext, responseContext, errorResponse) {

		logger.error(`Failed to execute Docker command=${requestContext.commandName} for registration=${requestContext.registrationName} - ${errorResponse.status} | ${errorResponse.data}`);
		responseContext.requestError = true;
		requestContext.rejectionHandler(responseContext);
	}

	_endHandler(requestContext, responseContext) {

		logger.info(`Finished executing Docker command=${requestContext.commandName} for registration=${requestContext.registrationName}`);
		requestContext.resolutionHandler(responseContext);
	}
}
