#!/usr/bin/env node

import fs from 'fs';
import {join} from 'path';

import esbuild from 'esbuild';
import {getBundleConfig} from '../node_modules/@vis.gl/dev-tools/dist/configuration/get-esbuild-config.js';

let entryPoint;
const env = {};
const externalPackages = [];

for (let index = 2; index < process.argv.length; index++) {
  const argument = process.argv[index];

  if (argument.startsWith('--external:')) {
    externalPackages.push(argument.slice('--external:'.length));
  } else if (argument.startsWith('--')) {
    const tokens = argument.slice(2).split('=');
    env[tokens[0]] = tokens[1] === undefined ? true : tokens[1];
  } else if (!entryPoint && argument.match(/\.(js|ts|cjs|mjs|jsx|tsx)$/)) {
    entryPoint = argument;
  }
}

await run();

async function run() {
  const packageRoot = process.cwd();
  const packageInfo = JSON.parse(fs.readFileSync(join(packageRoot, 'package.json'), 'utf-8'));

  const buildConfig = await getBundleConfig({
    ...env,
    ...(externalPackages.length > 0 ? {externals: externalPackages} : {}),
    input: entryPoint
  });

  buildConfig.define = {
    ...buildConfig.define,
    __VERSION__: JSON.stringify(packageInfo.version)
  };

  if (env.watch) {
    buildConfig.watch = true;
    await esbuild.build(buildConfig);
    // eslint-disable-next-line no-console
    console.log('watching...');
  } else {
    const result = await esbuild.build(buildConfig);
    if (result.errors.length > 0) {
      process.exit(1);
    }
  }
}
