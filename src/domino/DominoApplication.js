import config from 'config';
import bodyParser from "body-parser";
import logManager from "../domino_main";

const logger = logManager.createLogger('DominoApplication');

/**
 * Domino application entry point.
 */
export default class DominoApplication {

	constructor(registrations, express) {
		this._registrations = registrations;
		this._express = express;
		this._serverConfig = config.get('domino.server');
	}

	/**
	 * Runs Domino by starting up the application server.
	 */
	run() {
		let port = this._serverConfig.get('port');
		let host = this._serverConfig.get('host');

		this._registrations.registerRoutes(this._express);

		this._express
			.use(bodyParser.json())
			.listen(port, host, () => {
				logger.info(`Domino application server is running at http://${host}:${port}/`);
			});
	}
}
