import AbstractAppender from "simple-node-logger";
import TLPLogMessage from "./TLPLogMessage";
import axios from "axios";

const _APPENDER_NAME = "TLPAppender";

/**
 * Simple Node Logger Appender implementation that sends log messages to TinyLogProcessor (TLP).
 */
export default class TLPAppender extends AbstractAppender {

	constructor(opts) {
		super(TLPAppender._copyAndSetName(opts));
		this._tlpLogging = opts.tlpLogging;
	}
	/**
	 * Write method implementation that does the following steps:
	 *  - converts a Simple Node Logger log entry object to another compatible with TLP API
	 *  - Prepares a RequestPromise compatible request object
	 *  - Sends the log entry asynchronously to TLP
	 *
	 * @param entry Simple Node Logger log entry object
	 */
	write(entry) {

		const tlpLogMessage = new TLPLogMessage(entry);
		const request = this._prepareRequest(tlpLogMessage);

		axios(request)
			.catch(reason => {
				console.log(`Failed to send log message to TLP - reason: ${reason.message}`);
			});
	}

	_prepareRequest(tlpLogMessage) {

		return {
			method: "POST",
			url: `${this._tlpLogging.host}/logs`,
			data: tlpLogMessage
		};
	}

	static _copyAndSetName(opts) {
		return Object.assign({
			typeName: _APPENDER_NAME
		}, opts);
	}
}
