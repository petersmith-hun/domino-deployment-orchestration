export default class UnsupportedDeploymentMode extends Error {

	constructor(registration) {
		super(`Unsupported deployment mode for app=${registration.appName} using source=${registration.source.type} with executionMode=${registration.execution.executionHandler}`);
	}
}