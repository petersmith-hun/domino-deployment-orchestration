import {ContainerBuilder, JsonFileLoader} from "node-dependency-injection";
import path from "path";

// create IoC container
const configFilePath = path.join(__dirname, "config/di_config.json");
const container = new ContainerBuilder(true, path.join(__dirname));
const loader = new JsonFileLoader(container);

loader.load(configFilePath)
	.then(() => container.compile()
		.then(() => container.get("app.main").run()));
