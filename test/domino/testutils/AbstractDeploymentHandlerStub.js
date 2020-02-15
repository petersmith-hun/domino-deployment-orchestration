import AbstractDeploymentHandler from "../../../src/domino/core/deployment/handler/AbstractDeploymentHandler";

export default class AbstractDeploymentHandlerStub extends AbstractDeploymentHandler {

	constructor(configurationProviderMock) {
		super(configurationProviderMock);
		this.startResolution = null;
		this.stopResolution = null;
	}

	async start(registration) {

		if (this.startResolution === null) {
			return Promise.reject("Start should have not been called.");
		}

		console.log(`[${new Date().getTime()}] starting...`);
		return Promise.resolve(this.startResolution);
	}

	async stop(registration) {
		console.log(`[${new Date().getTime()}] stopping...`);
		return Promise.resolve(this.stopResolution);
	}

	setStartResolution(resolution) {
		this.startResolution = resolution;
	}

	setStopResolution(resolution) {
		this.stopResolution = resolution;
	}
}