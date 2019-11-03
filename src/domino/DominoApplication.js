import bodyParser from "body-parser";
import LoggerFactory from "./helper/LoggerFactory";

const packageJson = require("../../package.json");
const logger = LoggerFactory.createLogger("DominoApplication");

/**
 * Domino application entry point.
 */
export default class DominoApplication {

	constructor(registrations, express, configurationProvider) {
		this._registrations = registrations;
		this._express = express;
		this._serverConfig = configurationProvider.getServerConfiguration();
	}

	/**
	 * Runs Domino by starting up the application server.
	 */
	run() {
		const port = this._serverConfig.get("port");
		const host = this._serverConfig.get("host");

		this._express
			.use(bodyParser.json())
			.listen(port, host, () => {
				logger.info(`Domino (v${packageJson.version}) application server is listening at http://${host}:${port}/`);
			});

		this._registrations.registerRoutes(this._express);
	}
}
