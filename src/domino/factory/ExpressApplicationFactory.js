import express from "express";

/**
 * Factory implementation that creates an Express Application instance.
 * Should be used for dependency injection.
 */
export default class ExpressApplicationFactory {

	/**
	 * Returns an Express Application instance.
	 *
	 * @returns {app} created Express Application
	 */
	static createExpressApplication() {
		return express();
	}
}