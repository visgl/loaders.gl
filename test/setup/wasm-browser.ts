// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const originalFetch = globalThis.fetch;

/** Keeps the focused WASM suite hermetic while allowing local runtime and fixture requests. */
globalThis.fetch = (input, options) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== location.origin) {
    throw new Error(`Outbound network request blocked in WASM tests: ${url.origin}`);
  }
  return originalFetch(input, options);
};
