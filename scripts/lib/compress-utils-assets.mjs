// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import path from 'node:path';

/** Packages compress-utils WASM for classic workers and standalone browser bundles. */
export function createCompressUtilsAssetPlugin() {
  return {
    name: 'compress-utils-assets',
    setup(builder) {
      builder.onResolve({filter: /^#resolver$/}, args => {
        if (args.importer.includes('compress-utils')) return {path: 'resolver', namespace: 'compress-utils-resolver'};
      });
      builder.onLoad({filter: /.*/, namespace: 'compress-utils-resolver'}, () => ({
        contents: 'export const resolveWasm = url => Uint8Array.from(atob(url.href.split(",")[1]), character => character.charCodeAt(0));', loader: 'js'
      }));
      builder.onResolve({filter: /^compress-utils-wasm:/}, args => ({path: args.path.slice('compress-utils-wasm:'.length), namespace: 'compress-utils-wasm'}));
      builder.onLoad({filter: /.*/, namespace: 'compress-utils-wasm'}, async args => ({contents: await readFile(args.path), loader: 'dataurl'}));
      builder.onLoad({filter: /compress-utils[\\/]dist[\\/]algorithms[\\/].*\.js$/}, async args => {
        let contents = await readFile(args.path, 'utf8');
        const imports = [];
        contents = contents.replace(/new URL\("([^"]+\.wasm)", import\.meta\.url\)/g, (_match, relativePath) => {
          const name = `codecWasmAsset${imports.length}`;
          imports.push(`import ${name} from ${JSON.stringify(`compress-utils-wasm:${path.resolve(path.dirname(args.path), relativePath)}`)};`);
          return `new URL(${name})`;
        });
        return {contents: `${imports.join('\n')}\n${contents}`, loader: 'js', resolveDir: path.dirname(args.path)};
      });
    }
  };
}
