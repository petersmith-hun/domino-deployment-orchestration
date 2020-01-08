import SimpleLogger, {Logger} from "simple-node-logger";
import TLPAppender from "./TLPAppender";
import config from "config";
import rTracer from "cls-rtracer";

const _LOGFILE_CONFIG = "domino.system.logging.logfile";
const _TLP_LOGGING_CONFIG = "domino.system.logging.tlp-logging";

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

			if (LoggerFactory.logConfig.logFilePath) {
				LoggerFactory.logManager.createFileAppender(LoggerFactory.logConfig);
			}

			if (LoggerFactory.logConfig.tlpLogging.enabled) {
				LoggerFactory.logManager.addAppender(new TLPAppender(LoggerFactory.logConfig));
			}
		}
	}

	/**
	 * Creates a logger with the specified name via the existing log manager.
	 *
	 * @param loggerName name of the logger
	 * @returns {*|Logger} created logger instance
	 */
	static createLogger(loggerName) {
		return LoggerFactory._enhanceLoggerWithTracing(LoggerFactory.logManager.createLogger(loggerName));
	}

	static _enhanceLoggerWithTracing(logger) {

		const originalCreateEntry = logger.createEntry;
		logger.createEntry = (level, messageList) => {

			const entry = originalCreateEntry(level, messageList);
			entry.requestID = rTracer.id();

			return entry;
		};

		return logger;
	}

	static _createLogConfig() {
		return {
			logFilePath: LoggerFactory._getLogFilePath(),
			timestampFormat: "YYYY-MM-DD HH:mm:ss.SSSZ",
			tlpLogging: LoggerFactory._getTLPLoggingConfig()
		};
	}

	static _getLogFilePath() {

		return config.has(_LOGFILE_CONFIG)
			? config.get(_LOGFILE_CONFIG)
			: null;
	}

	static _getTLPLoggingConfig() {

		return config.has(_TLP_LOGGING_CONFIG)
			? config.get(_TLP_LOGGING_CONFIG)
			: {enabled: false};
	}
}

LoggerFactory.init();
