/**
 * Component to handle controller registrations.
 */
export default class ControllerRegistrations {

	constructor(dummyController) {
		this._dummyController = dummyController;
	}

	/**
	 * Starts registering routes.
	 *
	 * @param app Express application object
	 */
	registerRoutes(app) {

		// register dummy endpoints
		app.route('/dummy')
			.get((req, resp) => this._dummyController.getDummyResponse(req, resp))
			.post((req, resp) => this._dummyController.postDummyRequest(req, resp));
	}
}
