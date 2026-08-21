// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function getCWD() {
  if (typeof process !== 'undefined' && typeof process.cwd !== 'undefined') {
    return process.cwd();
  }
  const pathname = window.location?.pathname;
  return pathname?.slice(0, pathname.lastIndexOf('/') + 1) || '';
}
