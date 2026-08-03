// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Loads the installed parquet-wasm binary in Node.js or defers to browser asset resolution. */
export async function loadNodeWasmInput(): Promise<Uint8Array | undefined> {
  if (!isNodeRuntime()) {
    return undefined;
  }
  // Keep these specifiers dynamic so browser bundles do not include Node.js built-ins.
  const nodeProtocol = 'node:';
  const {readFile} = await import(/* @vite-ignore */ `${nodeProtocol}fs/promises`);
  const {createRequire} = await import(/* @vite-ignore */ `${nodeProtocol}module`);
  const {pathToFileURL} = await import(/* @vite-ignore */ `${nodeProtocol}url`);
  const moduleUrl =
    typeof __filename === 'string' ? pathToFileURL(__filename).toString() : import.meta.url;
  const require = createRequire(moduleUrl);
  const wasmPath = require.resolve('parquet-wasm/esm/parquet_wasm_bg.wasm');
  return await readFile(wasmPath);
}

/** Returns true when Node.js built-ins are available in the current runtime. */
function isNodeRuntime(): boolean {
  return Boolean((globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node);
}
