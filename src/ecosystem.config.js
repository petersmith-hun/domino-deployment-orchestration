/**
 * Ecosystem file for running Domino with PM2
 */
module.exports = {
	apps: [{
		name: "domino",
		script: "./src/domino_esm_start.js",
		watch: true,
		ignore_watch: [
			"logs",
			"storage",
			"node_modules"
		],
		env: {
			"NODE_ENV": "development",
		},
		node_args: [
			// --inspect-brk to wait for attach
			"--inspect=0.0.0.0:7099"
		],
		max_restarts: 1,
		treekill: false
	}]
};
