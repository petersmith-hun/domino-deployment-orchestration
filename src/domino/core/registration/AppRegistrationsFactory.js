import AppRegistration from "../domain/AppRegistrationDomain";

/**
 * Component to create application registration objects based on the registration configuration.
 */
export default class AppRegistrationsFactory {

	/**
	 * Reads and converts content of the registrations configuration.
	 *
	 * @param yamlSourceDocument source YAML document
	 * @returns {Map} map of application registrations by the application's name
	 */
	createRegistrations(yamlSourceDocument) {

		const registrationsNode = yamlSourceDocument["domino"]["registrations"];
		const registrations = registrationsNode
			.map(this._createAppRegistration)
			.map(registration => [registration.appName, registration]);

		return new Map(registrations);
	}

	_createAppRegistration(yamlDocumentRegistrationNode) {
		let appName = Object.keys(yamlDocumentRegistrationNode)[0];
		return new AppRegistration(appName, yamlDocumentRegistrationNode[appName]);
	}
}