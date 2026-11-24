// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
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
// Resolve public subpaths from their export maps instead of assuming matching folders.
configuration.alias = {...configuration.alias, ...getPackageExportAliases()};

/** Returns emitted JavaScript targets for every explicit workspace package subpath. */
function getPackageExportAliases() {
  const modulesDirectory = resolve(import.meta.dirname, '../modules');
  const aliases = {};
  for (const directory of readdirSync(modulesDirectory, {withFileTypes: true})) {
    if (!directory.isDirectory()) continue;
    const packageDirectory = resolve(modulesDirectory, directory.name);
    const manifest = JSON.parse(readFileSync(resolve(packageDirectory, 'package.json'), 'utf8'));
    for (const [subpath, conditions] of Object.entries(manifest.exports || {})) {
      if (subpath === '.' || typeof conditions !== 'object') continue;
      const target = conditions.import;
      if (typeof target === 'string' && target.endsWith('.js')) {
        aliases[manifest.name + subpath.slice(1)] = resolve(packageDirectory, target);
      }
    }
  }
  return aliases;
}

await build({...configuration, plugins: [...(configuration.plugins || []), createCompressUtilsAssetPlugin()]});
