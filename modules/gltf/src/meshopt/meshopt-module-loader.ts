// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/// <reference path="./meshoptimizer-decoder.d.ts" />

/** Imports the optional meshopt decoder only when a compressed-buffer operation requests it. */
export function loadMeshoptModule(): Promise<typeof import('meshoptimizer/decoder')> {
  return import('meshoptimizer/decoder');
}
