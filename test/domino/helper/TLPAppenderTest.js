import {afterEach, beforeEach, describe, it} from "mocha";
import {assert} from "chai";
import sinon from "sinon";
import TLPAppender from "../../../src/domino/helper/TLPAppender";
import rp from "request-promise";

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

	beforeEach(() => {
		tlpAppender = new TLPAppender(_LOGGING_CONFIG);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("Test scenarios for #write", () => {

		it("should send error log message via HTTP", async () => {

			// given
			const rpFake = sinon.fake.resolves(true);
			sinon.replace(rp, "post", rpFake);
			const entry = _prepareEntry(true);

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(rpFake.lastArg, _prepareExpectedRequest(true));
		});

		it("should send info log message via HTTP", async () => {

			// given
			const rpFake = sinon.fake.resolves(true);
			sinon.replace(rp, "post", rpFake);
			const entry = _prepareEntry(false);

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(rpFake.lastArg, _prepareExpectedRequest(false));
		});

		it("should add default request ID and send info log message via HTTP", async () => {

			// given
			const rpFake = sinon.fake.resolves(true);
			sinon.replace(rp, "post", rpFake);
			const entry = _prepareEntry(false);
			entry.requestID = null;
			const expectedRequest = _prepareExpectedRequest(false);
			expectedRequest.body.threadName = "main";

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(rpFake.lastArg, expectedRequest);
		});

		it("should silently fail on HTTP request error", async () => {

			// given
			const rpFake = sinon.fake.rejects(new Error("request error"));
			sinon.replace(rp, "post", rpFake);
			const entry = _prepareEntry(false);

			// when
			await tlpAppender.write(entry);

			// then
			assert.deepEqual(rpFake.lastArg, _prepareExpectedRequest(false));
		});

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
				uri: REQUEST_URI,
				body: {
					source: LOG_SOURCE,
					threadName: REQUEST_ID,
					timeStamp: TIMESTAMP,
					loggerName: CATEGORY,
					level: {levelStr: LEVEL.toUpperCase()},
					content: LOG_MESSAGE_CONTENT,
					exception: withError
						? _getExceptionContent()
						: null
				},
				json: true,
				simple: false
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
