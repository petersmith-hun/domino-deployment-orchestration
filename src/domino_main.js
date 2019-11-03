import {ContainerBuilder, YamlFileLoader} from "node-dependency-injection";
import path from "path";

// create IoC container
const container = new ContainerBuilder(true, path.join(__dirname));
const loader = new YamlFileLoader(container);
loader.load("./config/di_config.yml");
container.compile();

// start app
container.get("app.main").run();