/**
 * Dummy controller for testing purposes.
 *
 * To be removed later.
 */
export default class DummyController {

	constructor() {
		this._dummyGetResponse = {
			"message": "GET /dummy requested",
			"timestamp": new Date()
		};
		this._dummyPostResponse = {
			"message": "POST /dummy requested",
			"timestamp": new Date()
		};
	}

	/**
	 * Returns dummy response.
	 *
	 * @param req Express server request object
	 * @param resp Express server response object
	 */
	getDummyResponse(req, resp) {
		resp.status(200)
			.json(this._dummyGetResponse);
	}

	/**
	 * Processed dummy request.
	 *
	 * @param req Express server request object
	 * @param resp Express server response object
	 */
	postDummyRequest(req, resp) {
		resp.status(201)
			.json(this._dummyPostResponse);
	}
}