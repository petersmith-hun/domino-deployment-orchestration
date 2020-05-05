#!/usr/bin/env bash

npm install
npm install @babel/cli
npm install @babel/core
npm install pkg
npx babel src -d build/target/for_packaging/es5_src
cp package.json build/target/for_packaging/package.json
mkdir build/target/for_packaging/es5_src/config
cp config/di_config.json build/target/for_packaging/es5_src/config/di_config.json
node build/generate_require_file.js
npx pkg --targets=linux --output=build/target/out/domino .
mkdir build/target/out/logs
cp node_modules/bcrypt/build/Release/bcrypt_lib.node build/target/out/bcrypt_lib.node
cp node_modules/process-list/build/Release/processlist.node build/target/out/processlist.node
tar -czvf build/target/out/domino_release.tar.gz -C build/target/out .
