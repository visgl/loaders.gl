// loaders.gl
// SPDX-License-Identifier: MIT

export function installFilePolyfills() {}

// Dummy export to avoid import errors in browser tests
export const NodeFileSystem = null;

export function fetchNode(path: string, options: RequestInit): Promise<Response> {
  throw new Error('fetchNode not available in browser');
}

// Ensure process and process.env are defined, as Node code tends to crash on these
// @ts-ignore
globalThis.process = globalThis.process || {};
// @ts-ignore
globalThis.process.env = globalThis.process.env || {};
