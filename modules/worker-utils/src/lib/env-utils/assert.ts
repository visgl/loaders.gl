// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Replacement for the external assert method to reduce bundle size
// Note: We don't use the second "message" argument in calling code,
// so no need to support it here

/** Throws an `Error` with the optional `message` if `condition` is falsy */
export function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(message || 'loaders.gl assertion failed.');
  }
}
