const _POSSIBLE_VERSION_PARTS = ["major", "minor", "patch", "build"];
const _DEFAULT_VERSION_PART = "";
const _VERSION_PART_SEPARATOR = '.';
const _VERSION_PART_SEPARATOR_PARSER_REGEX = /[.\-_]+/;
const _ADDITIONAL_VERSION_PARTS_SEPARATOR = "_";
const _TO_STRING_PART_SEPARATOR = "-";

/**
 * Wrapper class for handling executable versions.
 * The given version string is split (at the dot, dash and underscore characters) to (at most) four parts - major, minor, patch and build version number.
 */
export default class ExecutableVersion {

	/**
	 * Initializes an ExecutableVersion object by the given version string.
	 * Unused parts are initialized to empty string.
	 * In case the version string consists of more than four parts, further parts are concatenated to the last ('build') part with underscores.
	 *
	 * @param versionString original version string
	 */
	constructor(versionString) {
		_POSSIBLE_VERSION_PARTS.forEach(value => this[value] = _DEFAULT_VERSION_PART);
		this._parseVersionString(versionString);
		this._rawVersion = versionString;
	}

	/**
	 * Compares this instance of the ExecutableVersion to the given one.
	 * Returns standard comparison result values:
	 *  - this > other   ->  1
	 *  - this < other   -> -1
	 *  - this == other  ->  0
	 * Based on the type of each version parts the implementation decides whether to compare as string or number.
	 *
	 * @param otherVersion another ExecutableVersion instance to compare this instance to
	 * @returns {number} comparision result value as described above
	 */
	compare(otherVersion) {

		let sortValue = 0;
		for (let index = 0; index < _POSSIBLE_VERSION_PARTS.length; index++) {
			sortValue = this._compareField(otherVersion, _POSSIBLE_VERSION_PARTS[index]);

			if (sortValue !== 0) {
				break;
			}
		}

		return sortValue;
	}

	/**
	 * Returns ExecutableVersion as a formatted version string (parts separated with dots).
	 *
	 * @returns {string} formatted version string
	 */
	getFormattedVersion() {
		return _POSSIBLE_VERSION_PARTS
			.map(part => this[part])
			.filter(part => part !== _DEFAULT_VERSION_PART)
			.join(_VERSION_PART_SEPARATOR);
	}

	/**
	 * Custom toString for ExecutableVersion.
	 * Concatenates the version number parts with semicolon character.
	 *
	 * @returns {string} custom toString
	 */
	toString() {
		return _POSSIBLE_VERSION_PARTS
			.map(part => this[part])
			.join(_TO_STRING_PART_SEPARATOR);
	}

	/**
	 * Returns the raw (unparsed) version string.
	 *
	 * @returns {string} unparsed version string
	 */
	getRawVersion() {
		return this._rawVersion;
	}

	_compareField(otherVersion, field) {

		const thisVersionPart = this[field];
		const otherVersionPart = otherVersion[field];

		return this._shouldParseAsString(thisVersionPart, otherVersionPart)
			? String(thisVersionPart).localeCompare(String(otherVersionPart))
			: this._normalizeToCompareValue(parseInt(thisVersionPart) - parseInt(otherVersionPart));
	}

	_parseVersionString(versionString) {

		const versionParts = versionString.split(_VERSION_PART_SEPARATOR_PARSER_REGEX);
		for (let index = 0; index < Math.min(versionParts.length, _POSSIBLE_VERSION_PARTS.length); index++) {
			this[_POSSIBLE_VERSION_PARTS[index]] = versionParts[index];
		}

		if (versionParts.length > _POSSIBLE_VERSION_PARTS.length) {
			this.build += _ADDITIONAL_VERSION_PARTS_SEPARATOR + this._joinAdditionalVersionParts(versionParts);
		}
	}

	_joinAdditionalVersionParts(versionParts) {
		return versionParts
			.slice(_POSSIBLE_VERSION_PARTS.length)
			.join(_ADDITIONAL_VERSION_PARTS_SEPARATOR);
	}


	_shouldParseAsString(thisVersionPart, otherVersionPart) {
		return thisVersionPart === _DEFAULT_VERSION_PART
			|| otherVersionPart === _DEFAULT_VERSION_PART
			|| isNaN(thisVersionPart)
			|| isNaN(otherVersionPart);
	}

	_normalizeToCompareValue(difference) {

		let compareValue = 0;
		if (difference > 0) {
			compareValue = 1;
		} else if (difference < 0) {
			compareValue = -1;
		}

		return compareValue;
	}
}
