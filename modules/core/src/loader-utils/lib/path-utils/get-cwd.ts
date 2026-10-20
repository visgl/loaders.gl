// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Returns the Node working directory or the window/worker script directory. */
export function getCWD(): string {
  if (typeof process !== 'undefined' && typeof process.cwd !== 'undefined') {
    return process.cwd();
  }
  const pathname = globalThis.location?.pathname;
  return pathname?.slice(0, pathname.lastIndexOf('/') + 1) || '';
}
