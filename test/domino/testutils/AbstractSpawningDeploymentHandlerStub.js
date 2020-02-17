import AbstractSpawningDeploymentHandler from "../../../src/domino/core/deployment/handler/AbstractSpawningDeploymentHandler";

export default class AbstractSpawningDeploymentHandlerStub extends AbstractSpawningDeploymentHandler {

	constructor(filenameUtilityMock, executorUserRegistryMock, executableBinaryHandlerMock, configurationProviderMock) {
		super(filenameUtilityMock, executorUserRegistryMock, executableBinaryHandlerMock, configurationProviderMock);
		this.spawnParameters = null;
	}

	setSpawnParameters(spawnParameters) {
		this.spawnParameters = spawnParameters;
	}

	_prepareSpawnParameters(registration) {
		return this.spawnParameters;
	}
}