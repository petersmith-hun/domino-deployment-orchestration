import {beforeEach, describe, it} from "mocha";
import {assert} from "chai";

import FilenameUtility from "../../../../src/domino/core/util/FilenameUtility";

describe("Unit tests for FilenameUtility", () => {

	let filenameUtility = null;

	beforeEach(() => {
		filenameUtility = new FilenameUtility();
	});

	describe("Test scenarios for #createFilename", () => {

		const filenameCreationScenarios = [
			{
				parameters: {originalname: "leaflet.backend.b50.jar", app: "leaflet", version: "1.2.0.50"},
				expectedFilename: "executable-leaflet-v1.2.0.50.jar"
			},
			{
				parameters: {originalname: "some-app.version__unnecessary--part.jar", app: "tlp", version: "1.5.2-b10-beta"},
				expectedFilename: "executable-tlp-v1.5.2-b10-beta.jar"
			},
			{
				parameters: {originalname: "app.....jar", app: "app", version: "1.3"},
				expectedFilename: "executable-app-v1.3.jar"
			},
		];

		filenameCreationScenarios.forEach(scenario => {

			it(`should create proper filename [${scenario.expectedFilename}]`, () => {

				// when
				const result = filenameUtility.createFilename(scenario.parameters);

				// then
				assert.equal(result, scenario.expectedFilename);
			});
		});
	});
});
