const glob = require("glob");
const fs = require("fs");

glob("./build/target/for_packaging/es5_src/domino/**/*.js", (err, files) => {

	let requiredFiles = [
		"regenerator-runtime/runtime",
		"./config/di_config.json",
		"./domino_main.js"]

	files.forEach((filename) => {
		const cleanedFilename = filename.replace("./build/target/for_packaging/es5_src", ".");
		requiredFiles.push(cleanedFilename);
	});

	requiredFiles.forEach((filename) => {
		const requireEntry = `require("${filename}");\n`;
		fs.appendFileSync("./build/target/for_packaging/es5_src/domino_pkg_entry_point.js", requireEntry);
	});
});
