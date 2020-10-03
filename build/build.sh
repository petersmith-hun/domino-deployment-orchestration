#!/usr/bin/env bash

# install dependencies
npm install
npm install @babel/cli
npm install @babel/core
npm install pkg

# compile source to ES5
npx babel src -d build/target/for_packaging/es5_src

# copy required files
cp package.json build/target/for_packaging/package.json
mkdir build/target/for_packaging/es5_src/config
cp config/di_config.json build/target/for_packaging/es5_src/config/di_config.json

# generate "require" file (code-dependency tree is invisible because of the DI framework)
node build/generate_require_file.js

# package executable
npx pkg --targets=linux --output=build/target/out/domino .

# create release package (including the native modules)
mkdir build/target/out/logs
cp node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node build/target/out/bcrypt_lib.node
cp node_modules/process-list/build/Release/processlist.node build/target/out/processlist.node
tar -czvf build/target/domino_release.tar.gz -C build/target/out .
