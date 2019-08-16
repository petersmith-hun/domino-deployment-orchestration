export default class AbstractDeploymentHandler {

	deploy(registration, version) {
		throw new Error("Not implemented operation");
	}

	start(registration) {
		throw new Error("Not implemented operation");
	}

	stop(registration) {
		throw new Error("Not implemented operation");
	}

	restart(registration) {
		throw new Error("Not implemented operation");
	}
}