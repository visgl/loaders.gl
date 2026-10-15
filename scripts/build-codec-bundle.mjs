// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {getBundleConfig} from '../node_modules/@vis.gl/dev-tools/dist/configuration/get-esbuild-config.js';
import {createCompressUtilsAssetPlugin} from './lib/compress-utils-assets.mjs';

const options = {};
for (const argument of process.argv.slice(2)) {
  if (argument.startsWith('--')) {
    const [key, ...values] = argument.slice(2).split('=');
    options[key] = values.length ? values.join('=') : true;
  } else options.input = argument;
}
const configuration = await getBundleConfig(options);
await build({...configuration, plugins: [...(configuration.plugins || []), createCompressUtilsAssetPlugin()]});
