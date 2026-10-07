// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile, writeFile} from 'node:fs/promises';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: node scripts/vendor-lzo-wasm.mjs /path/to/lzo.wasm');
const bytes = await readFile(sourcePath);
const module = new WebAssembly.Module(bytes);
if (WebAssembly.Module.imports(module).length) throw new Error('LZO asset must be self-contained');
if (WebAssembly.Module.exports(module).some(({name}) => name.startsWith('cu_compress'))) {
  throw new Error('LZO asset must be decoder-only');
}
const instance = new WebAssembly.Instance(module, {});
if (instance.exports.cu_algorithm_available(11) !== 1) throw new Error('LZO ABI value 11 is missing');
await writeFile(
  new URL('../modules/compression/src/lib/compress-utils/lzo/wasm-data.ts', import.meta.url),
  `/** Generated decoder-only compress-utils WASM. See PROVENANCE.md for source and build instructions. */\nexport const LZO_WASM_BASE64 = '${bytes.toString('base64')}';\n`
);
