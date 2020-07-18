import DockerRequest, {DockerCommand} from "../../domain/DockerRequest";

const _DOCKER_LIFECYCLE_COMMANDS = [DockerCommand.START, DockerCommand.STOP, DockerCommand.RESTART, DockerCommand.REMOVE];

/**
 * Docker Engine API request factory.
 */
export default class DockerRequestFactory {

	constructor(dockerCreateContainerRequestMapper) {
		this._dockerCreateContainerRequestMapper = dockerCreateContainerRequestMapper;
	}

	/**
	 * Builds a Docker container creation request based on the provided parameters.
	 *
	 * In case a custom creation request is specified in the registration, that will be used without any modification.
	 * Otherwise the container creation request will be built by DockerCreateContainerRequestMapper.
	 *
	 * @param imageName name of the Docker image
	 * @param tag tag of the Docker image
	 * @param registration application registration object
	 * @returns {DockerRequest} created DockerRequest object containing the information to be sent to Docker Engine
	 */
	createDockerContainerCreationRequest(imageName, tag, registration) {

		const requestBody = registration.execution.args.custom || this._dockerCreateContainerRequestMapper.prepareContainerCreationRequest(registration);

		requestBody.Image = `${imageName}:${tag}`;

		return new DockerRequest(DockerCommand.CREATE_CONTAINER, registration)
			.addUrlParameter("name", registration.execution.commandName)
			.setBody(requestBody);
	}

	/**
	 * Builds a Docker image pull request based on the provided parameters.
	 *
	 * @param imageName name of the Docker image
	 * @param tag tag of the Docker image
	 * @param registration application registration object
	 * @returns {DockerRequest} created DockerRequest object containing the information to be sent to Docker Engine
	 */
	createDockerPullRequest(imageName, tag, registration) {

		return new DockerRequest(DockerCommand.PULL, registration)
			.addUrlParameter("image", imageName)
			.addUrlParameter("tag", tag);
	}

	/**
	 * Builds a Docker lifecycle request based on the provided parameters.
	 * Accepted Docker lifecycle commands are: START, STOP, RESTART, REMOVE.
	 *
	 * @param registration application registration object
	 * @param dockerCommand DockerCommand object defining the lifecycle command to be executed
	 * @returns {DockerRequest} created DockerRequest object containing the information to be sent to Docker Engine
	 */
	createDockerLifecycleCommand(registration, dockerCommand) {

		if (!_DOCKER_LIFECYCLE_COMMANDS.includes(dockerCommand)) {
			throw new Error(`Invalid dockerCommand=${dockerCommand} tried to be used as lifecycle command for registration=${registration.appName}`);
		}

		return new DockerRequest(dockerCommand, registration)
			.addUrlParameter("id", registration.execution.commandName);
	}
}
