import {ContainerBuilder, YamlFileLoader} from "node-dependency-injection";
import path from 'path';

let container = new ContainerBuilder(true, path.join(__dirname));
let loader = new YamlFileLoader(container);

loader.load('./config/di_config.yml');
container.compile();

container.get('app.main').run();