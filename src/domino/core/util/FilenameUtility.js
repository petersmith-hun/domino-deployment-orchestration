/**
 * Utility for properly forming filenames used in executable storage.
 */
export default class FilenameUtility {

	/**
	 * Forms a proper filename which the executable will be stored with.
	 *
	 * @param parameters parameter map object (originalname, app and version fields must be existing)
	 * @returns {string} created filename
	 */
	createFilename(parameters) {

		const filenameParts = parameters.originalname.split('.');
		const extension = filenameParts[filenameParts.length - 1];

		return `executable-${parameters.app}-v${parameters.version}.${extension}`;
	}
}
