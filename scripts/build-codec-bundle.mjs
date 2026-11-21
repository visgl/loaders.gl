// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {join} from 'node:path';
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
// The workspace default rewrites subpaths to matching directories. Query exports
// intentionally build from the internal scan implementation.
const coreDirectory = configuration.alias?.['@loaders.gl/core'];
if (coreDirectory) {
  configuration.alias['@loaders.gl/core/query'] = join(coreDirectory, 'scan');
  configuration.alias['@loaders.gl/core/query/sql'] = join(coreDirectory, 'scan/query');
}
await build({...configuration, plugins: [...(configuration.plugins || []), createCompressUtilsAssetPlugin()]});
