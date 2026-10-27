// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Imports the package-local meshopt decoder on the first compressed-buffer request. */
export function loadMeshoptModule(): Promise<typeof import('../libs/meshopt-decoder.mjs')> {
  return import('../libs/meshopt-decoder.mjs');
}
