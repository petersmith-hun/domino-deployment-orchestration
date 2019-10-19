import fs from "fs";
import ExecutableVersion from "../domain/ExecutableVersion";

const _APP_NAME_MATCHER = /^executable-([a-z]+)-v.*$/;
const _APP_VERSION_MATCHER = /^executable-[a-z]+-v([0-9a-zA-Z.\-_]+)\.[a-z]{3,4}$/;
const _DEFAULT_VERSION = null;

/**
 * Utility class to handle stored executables by their version.
 */
export default class ExecutableVersionUtility {

	constructor(configurationProvider) {
		this._storageConfig = configurationProvider.getStorageConfiguration();
	}

	/**
	 * Find the latest stored version of the given application.
	 *
	 * @param app name of the application (as registered) to find latest version of
	 * @returns {*} latest version (as original version string
	 */
	findLatestVersion(app) {

		const filesInStorage = fs.readdirSync(this._storageConfig.path);
		const appFiles = this._filterAppFiles(app, filesInStorage);

		return appFiles
			? this._doFindLatestVersion(appFiles)
			: _DEFAULT_VERSION;
	}

	_filterAppFiles(app, files) {
		return files.filter(file => this._isSameApplication(app, file))
	}

	_isSameApplication(app, file) {

		const appMatch = file.match(_APP_NAME_MATCHER);
		return appMatch !== null && appMatch[1] === app;
	}

	_doFindLatestVersion(appFiles) {

		const extractedVersion = appFiles.map(this._extractVersion)
			.filter(version => version !== null)
			.sort((version1, version2) => version2.compare(version1))
			.find(() => true);

		return extractedVersion || _DEFAULT_VERSION;
	}

	_extractVersion(file) {

		const versionString = file.match(_APP_VERSION_MATCHER);
		return versionString
			? new ExecutableVersion(versionString[1])
			: null;
	}
}
