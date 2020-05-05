import {ContainerBuilder, JsonFileLoader} from "node-dependency-injection";
import path from "path";

// create IoC container
const container = new ContainerBuilder(true, path.join(__dirname));
const loader = new JsonFileLoader(container);
loader.load(path.join(__dirname, "config/di_config.json"));
container.compile();

// start app
container.get("app.main").run();