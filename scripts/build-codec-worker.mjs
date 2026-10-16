// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {createCompressUtilsAssetPlugin} from './lib/compress-utils-assets.mjs';

/** Preserves the existing worker CLI options while adding codec asset packaging. */
function parseBuildArguments(argumentsList) {
  const options = {entryPoints: [], plugins: [createCompressUtilsAssetPlugin()]};
  for (const argument of argumentsList) {
    if (!argument.startsWith('--')) {options.entryPoints.push(argument); continue;}
    const [key, ...valueParts] = argument.slice(2).split('=');
    const value = valueParts.length ? valueParts.join('=') : true;
    const separator = key.indexOf(':');
    const kind = separator < 0 ? key : key.slice(0, separator);
    const name = separator < 0 ? undefined : key.slice(separator + 1);
    if (kind === 'external' || kind === 'inject') {
      options[kind] ||= [];
      options[kind].push(...String(name || value).replace(/[{}]/g, '').split(','));
    } else if (kind === 'define' || kind === 'banner') {
      options[kind] ||= {};
      options[kind][name] = kind === 'define' && name === '__VERSION__' ? JSON.stringify(process.env.npm_package_version) : String(value).replace(/\\"/g, '"');
    } else {
      const optionName = key.replace(/-([a-z])/g, (_match, character) => character.toUpperCase());
      options[optionName] = value === 'true' ? true : value === 'false' ? false : value;
    }
  }
  return options;
}

await build(parseBuildArguments(process.argv.slice(2)));
