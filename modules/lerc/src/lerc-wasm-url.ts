// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** URL of the vendored LERC WebAssembly binary. */
export const LERC_WASM_URL =
  typeof __dirname !== 'undefined'
    ? new URL('./libs/lerc/lerc-wasm.wasm', `file://${__dirname}/`).toString()
    : new URL('./libs/lerc/lerc-wasm.wasm', import.meta.url).toString();
