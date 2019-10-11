import RuntimeRegistration from "../domain/RuntimeRegistrationDomain";

/**
 * Factory to create runtime registration objects based on the registration configuration.
 */
export default class RuntimeRegistrationsFactory {

	/**
	 * Reads and converts content of the runtime registrations configuration.
	 *
	 * @param yamlSourceDocument source YAML document
	 * @returns {Map} map of runtime registrations by the runtime's name
	 */
	createRuntimeRegistrations(yamlSourceDocument) {

		const runtimesNode = yamlSourceDocument["domino"]["runtimes"];
		const runtimes = runtimesNode
			.map(this._createRuntimeRegistration)
			.map(runtime => [runtime.runtimeName, runtime]);

		return new Map(runtimes);
	}

	_createRuntimeRegistration(yamlDocumentRegistrationNode) {
		const runtimeName = Object.keys(yamlDocumentRegistrationNode)[0];
		return new RuntimeRegistration(runtimeName, yamlDocumentRegistrationNode[runtimeName]);
	}
}