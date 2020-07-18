import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import DockerSocketResponseHandler from "../../../../../src/domino/core/deployment/docker/DockerSocketResponseHandler";
import {ResponseHandlerPolicy} from "../../../../../src/domino/core/domain/DockerRequest";


describe("Unit tests for DockerSocketResponseHandler", () => {

	let dockerSocketResponseHandler = null;

	beforeEach(() => {
		dockerSocketResponseHandler = new DockerSocketResponseHandler();
	});

	describe("Test scenarios for #readDockerResponse", () => {

		it("should log response and resolve", () => {

			// given
			let result = null;
			let rejection = null;
			const responseObjectMock = new ResponseObjectMock();
			const requestContext = {
				responseHandlerPolicy: ResponseHandlerPolicy.SINGLE,
				commandName: "START",
				registrationName: "testapp1",
				responseObject: responseObjectMock,
				resolutionHandler: (handlerResult) => result = handlerResult,
				rejectionHandler: (handlerResult) => rejection = handlerResult
			};
			const response = {
				statusCode: 200
			}

			// when
			dockerSocketResponseHandler.readDockerResponse(requestContext);
			responseObjectMock.getHandler("response")(response);
			responseObjectMock.getHandler("end")();

			// then
			assert.equal(rejection, null);
			assert.deepEqual(result, {
				requestError: false,
				streamingResult: false,
				statusCode: response.statusCode
			});
		});

		it("should read data with single response policy and collecting the response", () => {

			// given
			let result = null;
			let rejection = null;
			const responseObjectMock = new ResponseObjectMock();
			const requestContext = {
				responseHandlerPolicy: ResponseHandlerPolicy.SINGLE,
				commandName: "PULL",
				registrationName: "testapp2",
				responseObject: responseObjectMock,
				dockerVersion: "v1.40",
				resolutionHandler: (handlerResult) => result = handlerResult,
				rejectionHandler: (handlerResult) => rejection = handlerResult
			};
			const data = '{"status": "Downloaded", "message": "Image pulled"}';

			// when
			dockerSocketResponseHandler.readDockerResponse(requestContext);
			responseObjectMock.getHandler("data")(data);
			responseObjectMock.getHandler("end")();

			// then
			assert.equal(rejection, null);
			assert.deepEqual(result, {
				requestError: false,
				responseData: {
					status: "Downloaded",
					message: "Image pulled"
				}
			});
		});

		it("should read data with streaming response policy and collecting the response", () => {

			// given
			let result = null;
			let rejection = null;
			const responseObjectMock = new ResponseObjectMock();
			const requestContext = {
				responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM,
				commandName: "PULL",
				registrationName: "testapp3",
				responseObject: responseObjectMock,
				dockerVersion: "v1.40",
				resolutionHandler: (handlerResult) => result = handlerResult,
				rejectionHandler: (handlerResult) => rejection = handlerResult
			};
			const data1 = '{"status": "Downloading", "data": "chunk #1"}';
			const data2 = '  {"status": "Downloading", "data": "chunk #2"}     ';
			const data3 = '{"status": "Downloading", "data": "chunk #3"}\n{"status": "Downloaded", "message": "Image pulled"}';

			// when
			dockerSocketResponseHandler.readDockerResponse(requestContext);
			responseObjectMock.getHandler("data")(data1);
			responseObjectMock.getHandler("data")(data2);
			responseObjectMock.getHandler("data")(data3);
			responseObjectMock.getHandler("end")();

			// then
			assert.equal(rejection, null);
			assert.deepEqual(result, {
				requestError: false,
				responseData: [{
					status: "Downloading",
					data: "chunk #1"
				}, {
					status: "Downloading",
					data: "chunk #2"
				}, {
					status: "Downloading",
					data: "chunk #3"
				}, {
					status: "Downloaded",
					message: "Image pulled"
				}]
			});
		});

		it("should read data with streaming response policy and only logging the response", () => {

			// given
			let result = null;
			let rejection = null;
			const responseObjectMock = new ResponseObjectMock();
			const requestContext = {
				responseHandlerPolicy: ResponseHandlerPolicy.LOG_ONLY_STREAM,
				commandName: "PULL",
				registrationName: "testapp4",
				responseObject: responseObjectMock,
				dockerVersion: "v1.40",
				resolutionHandler: (handlerResult) => result = handlerResult,
				rejectionHandler: (handlerResult) => rejection = handlerResult
			};
			const data1 = '{"status": "Downloading", "data": "chunk #1"}';
			const data2 = '{"status": "Downloading", "data": "chunk #2"}\n{"status": "Downloaded", "message": "Image pulled"}';

			// when
			dockerSocketResponseHandler.readDockerResponse(requestContext);
			responseObjectMock.getHandler("data")(data1);
			responseObjectMock.getHandler("data")(data2);
			responseObjectMock.getHandler("end")();

			// then
			assert.equal(rejection, null);
			assert.deepEqual(result, {
				requestError: false
			});
		});

		it("should handle error response and reject", () => {

			// given
			let result = null;
			let rejection = null;
			const responseObjectMock = new ResponseObjectMock();
			const requestContext = {
				responseHandlerPolicy: ResponseHandlerPolicy.SINGLE,
				commandName: "START",
				registrationName: "testapp5",
				responseObject: responseObjectMock,
				dockerVersion: "v1.40",
				resolutionHandler: (handlerResult) => result = handlerResult,
				rejectionHandler: (handlerResult) => rejection = handlerResult
			};
			const error = {
				message: "Connection closed"
			};

			// when
			dockerSocketResponseHandler.readDockerResponse(requestContext);
			responseObjectMock.getHandler("error")(error);

			// then
			assert.equal(result, null);
			assert.deepEqual(rejection, {
				requestError: true
			});
		});
	});
});

class ResponseObjectMock {

	constructor() {
		this.handlers = new Map();
	}

	on(event, handler) {
		this.handlers.set(event, handler);
		return this;
	}

	getHandler(event) {
		return this.handlers.get(event);
	}
}
