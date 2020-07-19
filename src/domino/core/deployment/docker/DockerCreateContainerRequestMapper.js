const _identityMapping = (value) => value;

/**
 * Mapper component able to generate Docker container creation requests from Domino registration configurations.
 */
export default class DockerCreateContainerRequestMapper {

	constructor() {
		this._mapping = {
			"command-args": {
				"Cmd": _identityMapping
			},
			"environment": {
				"Env": (value) => Object.keys(value).map((key) => `${key}=${value[key]}`)
			},
			"volumes": {
				"HostConfig.Binds": (value) => this._extractVolumeMappings(value, true),
				"Volumes": (value) => this._extractVolumeMappings(value, false)
			},
			"network-mode": {
				"HostConfig.NetworkMode": _identityMapping
			},
			"ports": {
				"HostConfig.PortBindings": (value) => this._extractPortMappings(value, true),
				"ExposedPorts": (value) => this._extractPortMappings(value, false)
			},
			"restart-policy": {
				"HostConfig.RestartPolicy.Name": _identityMapping
			}
		};
	}

	/**
	 * Creates a Docker container creation request based on the provided Domino registration object.
	 *
	 * @param registration Domino application registration object
	 * @returns Docker container creation request body object
	 */
	prepareContainerCreationRequest(registration) {

		let requestBody = {};
		Object.keys(this._mapping).forEach(configKey => {
			if (registration.execution.args[configKey]) {
				Object.keys(this._mapping[configKey]).forEach(targetNode => {
					const targetNodePath = targetNode.split("\.");
					const mapperFunction = this._mapping[configKey][targetNode];
					this._assignValueToLeafNode(requestBody, targetNodePath, mapperFunction(registration.execution.args[configKey]));
				});
			}
		});

		return requestBody;
	}

	_extractVolumeMappings(volumeConfigMap, asBinding) {

		const volumeMappings = asBinding ? [] : {};
		Object.keys(volumeConfigMap).forEach((key) => {
			if (asBinding) {
				volumeMappings.push(`${key}:${volumeConfigMap[key]}`);
			} else {
				volumeMappings[volumeConfigMap[key].split(":")[0]] = {};
			}
		});

		return volumeMappings;
	}

	_extractPortMappings(portConfigMap, includeHostPort) {

		const portMappings = {};
		Object.keys(portConfigMap).forEach((key) => {
			portMappings[portConfigMap[key]] = includeHostPort
				? [{"HostPort": key}]
				: {};
		});

		return portMappings;
	}

	_assignValueToLeafNode(requestBody, targetNodePath, valueToAssign) {

		if (targetNodePath.length > 1) {
			if (!requestBody[targetNodePath[0]]) {
				requestBody[targetNodePath[0]] = {};
			}
			this._assignValueToLeafNode(requestBody[targetNodePath[0]], targetNodePath.slice(1), valueToAssign);
		} else {
			requestBody[targetNodePath[0]] = valueToAssign
		}
	}
}
