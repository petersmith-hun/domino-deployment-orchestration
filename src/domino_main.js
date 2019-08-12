import {ContainerBuilder, YamlFileLoader} from "node-dependency-injection";
import path from 'path';
import SimpleLogger from "simple-node-logger";
import config from "config";

// enable and configure logging
const logManager = new SimpleLogger();
const logConfig = {
	logFilePath: config.has("domino.logfile")
		? config.get("domino.logfile")
		: null,
	timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS"
};
logManager.createConsoleAppender(logConfig);
logManager.createFileAppender(logConfig);
export default logManager;

// create IoC container
let container = new ContainerBuilder(true, path.join(__dirname));
let loader = new YamlFileLoader(container);
loader.load('./config/di_config.yml');
container.compile();

// start app
container.get('app.main').run();