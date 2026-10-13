// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Emits separate WASM assets, resolved against the original script URL in every worker format. */
export function createCompressUtilsAssetPlugin() {
  return {
    name: 'compress-utils-assets',
    setup(builder) {
      const moduleFormat = builder.initialOptions.format === 'esm';
      builder.initialOptions.assetNames = 'codec-assets/[name]-[hash]';
      if (!moduleFormat) {
        // Inject inside each bundle's scope, not a shared global that another script can overwrite.
        builder.initialOptions.inject = [
          ...(builder.initialOptions.inject || []),
          fileURLToPath(new URL('./codec-asset-base.js', import.meta.url))
        ];
      }
      builder.onResolve({filter: /^#resolver$/}, args => {
        if (args.importer.includes('compress-utils')) return {path: 'resolver', namespace: 'compress-utils-resolver'};
      });
      builder.onLoad({filter: /.*/, namespace: 'compress-utils-resolver'}, () => ({
        contents: 'export const resolveWasm = async url => { if (url.protocol === "file:") { const filesystemModule = "node:fs/promises"; const {readFile} = await import(filesystemModule); return new Uint8Array(await readFile(url)); } return fetch(url); };', loader: 'js'
      }));
      builder.onResolve({filter: /^compress-utils-wasm:/}, args => ({path: args.path.slice('compress-utils-wasm:'.length), namespace: 'compress-utils-wasm'}));
      builder.onLoad({filter: /.*/, namespace: 'compress-utils-wasm'}, async args => ({contents: await readFile(args.path), loader: 'file'}));
      builder.onLoad({filter: /compress-utils[\\/]dist[\\/]algorithms[\\/].*\.js$/}, async args => {
        let contents = await readFile(args.path, 'utf8');
        const imports = [];
        contents = contents.replace(/new URL\("([^"]+\.wasm)", import\.meta\.url\)/g, (_match, relativePath) => {
          const name = `codecWasmAsset${imports.length}`;
          imports.push(`import ${name} from ${JSON.stringify(`compress-utils-wasm:${path.resolve(path.dirname(args.path), relativePath)}`)};`);
          return `new URL(${name}, ${moduleFormat ? 'import.meta.url' : '__loadersCodecAssetBaseUrl'})`;
        });
        return {contents: `${imports.join('\n')}\n${contents}`, loader: 'js', resolveDir: path.dirname(args.path)};
      });
    }
  };
}
