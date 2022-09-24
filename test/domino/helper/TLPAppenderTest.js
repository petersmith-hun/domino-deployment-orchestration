import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import axios from "axios";
import * as mockery from "mockery";

const _LOGGING_CONFIG = {
	tlpLogging: {
		host: "http://localhost:9090/tlp"
	}
};
const REQUEST_ID = "request-id";
const TIMESTAMP = 1581272591;
const CATEGORY = "TestLogger";
const LEVEL = "error";
const LOG_MESSAGE_CONTENT = "log message content";
const ERROR_CLASS = "AuthenticationError";
const ERROR_MESSAGE = "Test authentication failure";
const STACK_TRACE = "at TestRunner:30";
const HTTP_METHOD = "POST";
const REQUEST_URI = "http://localhost:9090/tlp/logs";
const LOG_SOURCE = "domino";

describe("Unit tests for TLPAppender", () => {

	let tlpAppender = null;
	let requestOptionsParameterValue = null;

	beforeEach(() => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		});
	});

	afterEach(() => {
		mockery.resetCache();
		requestOptionsParameterValue = null;
	});

	describe("Test scenarios for #write", () => {

		it("should send error log message via HTTP", async () => {

			// given
			tlpAppender = _prepareMockedTLPAppender(true);
			const entry = _prepareEntry(true);

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(requestOptionsParameterValue, _prepareExpectedRequest(true));
		});

		it("should send info log message via HTTP", async () => {

			// given
			tlpAppender = _prepareMockedTLPAppender(true);
			const entry = _prepareEntry(false);

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(requestOptionsParameterValue, _prepareExpectedRequest(false));
		});

		it("should add default request ID and send info log message via HTTP", async () => {

			// given
			tlpAppender = _prepareMockedTLPAppender(true);
			const entry = _prepareEntry(false);
			entry.requestID = null;
			const expectedRequest = _prepareExpectedRequest(false);
			expectedRequest.data.threadName = "main";

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(requestOptionsParameterValue, expectedRequest);
		});

		it("should silently fail on HTTP request error", async () => {

			// given
			tlpAppender = _prepareMockedTLPAppender(false);
			const entry = _prepareEntry(false);

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(requestOptionsParameterValue, _prepareExpectedRequest(false));
		});

		function _prepareMockedTLPAppender(successful) {

			mockery.deregisterAll();
			mockery.registerMock("axios", (requestOptions) => {
				requestOptionsParameterValue = requestOptions
				return successful
					? Promise.resolve()
					: Promise.reject(new Error("request error"));
			});

			return new (require("../../../src/domino/helper/TLPAppender").default)(_LOGGING_CONFIG);
		}

		function _prepareEntry(withError) {

			const entry = {
				requestID: REQUEST_ID,
				ts: TIMESTAMP,
				category: CATEGORY,
				level: LEVEL,
				msg: [LOG_MESSAGE_CONTENT]
			};

			if (withError) {
				entry.msg.push({
					name: ERROR_CLASS,
					message: ERROR_MESSAGE,
					stack: STACK_TRACE
				});
			}

			return entry;
		}

		function _prepareExpectedRequest(withError) {

			return  {
				method: HTTP_METHOD,
				url: REQUEST_URI,
				data: {
					source: LOG_SOURCE,
					threadName: REQUEST_ID,
					timeStamp: TIMESTAMP,
					loggerName: CATEGORY,
					level: {levelStr: LEVEL.toUpperCase()},
					content: LOG_MESSAGE_CONTENT,
					exception: withError
						? _getExceptionContent()
						: null
				}
			};
		}

		function _getExceptionContent() {
			return {
				className: ERROR_CLASS,
				message: ERROR_MESSAGE,
				stackTrace: STACK_TRACE
			};
		}
	});
});
