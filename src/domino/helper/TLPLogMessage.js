const _SOURCE_APPLICATION = "domino";
const _LOG_MESSAGE_INDEX = 0;
const _EXCEPTION_DATA_INDEX = 1;

const _DEFAULT_THREAD_NAME = "main";

/**
 * Domain class representing a TLP API compatible log message.
 */
export default class TLPLogMessage {

	/**
	 * This constructor extract and converts log entry data from a Simple Node Logger log entry object.
	 *
	 * @param entry Simple Node Logger log entry object
	 */
	constructor(entry) {

		this.source = _SOURCE_APPLICATION;
		this.threadName = entry.requestID || _DEFAULT_THREAD_NAME;
		this.timeStamp = entry.ts;
		this.loggerName = entry.category;
		this.level = {levelStr: entry.level.toUpperCase()};
		this.content = entry.msg[_LOG_MESSAGE_INDEX];
		this.exception = this._extractException(entry)
	}

	_extractException(entry) {

		let exception = null;
		if (entry.msg.length > 1) {

			const exceptionEntry = entry.msg[_EXCEPTION_DATA_INDEX];
			exception = {
				className: exceptionEntry.name,
				message: exceptionEntry.message,
				stackTrace: exceptionEntry.stack
			}
		}

		return exception;
	}
}
