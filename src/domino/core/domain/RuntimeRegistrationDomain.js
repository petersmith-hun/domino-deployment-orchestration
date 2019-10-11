/**
 * Domain class representing a runtime registration.
 */
export default class RuntimeRegistration {

	constructor(runtimeName, yamlSourceDocumentSourceNode) {
		this.runtimeName = runtimeName;
		this.binary = yamlSourceDocumentSourceNode["binary"];
		this.resourceMarker = yamlSourceDocumentSourceNode["resource-marker"];
	}
}
