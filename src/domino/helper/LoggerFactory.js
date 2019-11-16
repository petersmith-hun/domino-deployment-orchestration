import SimpleLogger from "simple-node-logger";
import config from "config";

/**
 * Factory component to configure logging and create loggers.
 */
export default class LoggerFactory {

	/**
	 * Initializes log manager if it is needed.
	 */
	static init() {
		if (LoggerFactory.logManager === undefined) {
			LoggerFactory.logManager = new SimpleLogger();
			LoggerFactory.logConfig = LoggerFactory._createLogConfig();
			LoggerFactory.logManager.createConsoleAppender(LoggerFactory.logConfig);
			LoggerFactory.logManager.createFileAppender(LoggerFactory.logConfig);
		}
	}

	/**
	 * Creates a logger with the specified name via the existing log manager.
	 *
	 * @param loggerName name of the logger
	 * @returns {*|Logger} created logger instance
	 */
	static createLogger(loggerName) {
		return LoggerFactory.logManager.createLogger(loggerName);
	}

	static _createLogConfig() {
		return {
			logFilePath: LoggerFactory._getLogFilePath(),
			timestampFormat: "YYYY-MM-DD HH:mm:ss.SSSZ"
		};
	}

	static _getLogFilePath() {

		return config.has("domino.logfile")
			? config.get("domino.logfile")
			: null;
	}
}

LoggerFactory.init();
