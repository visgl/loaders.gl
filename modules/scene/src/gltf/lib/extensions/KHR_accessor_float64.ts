// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';

/** Draft extension enabling binary64 accessor components. */
export const name = 'KHR_accessor_float64';

/** Validate the declared extension without converting or removing binary64 data. */
export function preprocess(gltf: GLTFWithBuffers): void {
  const {json} = gltf;
  if (!json.extensionsUsed?.includes(name) && !json.extensionsRequired?.includes(name)) return;
  if (!json.extensionsUsed?.includes(name) || !json.extensionsRequired?.includes(name)) {
    throw new Error(`${name}: must be declared in extensionsUsed and extensionsRequired.`);
  }
  for (const [index, accessor] of (json.accessors || []).entries()) {
    if (accessor.componentType === 5130 && accessor.normalized) {
      throw new Error(`${name}: accessor ${index} must not be normalized.`);
    }
  }
}
