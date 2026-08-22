// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(`@loaders.gl/polyfills assertion ${message}`);
  }
}
