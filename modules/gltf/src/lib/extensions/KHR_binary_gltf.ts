// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF 1.0 EXTENSION: KHR_binary_glTF
// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
/* eslint-disable camelcase */

import type {GLTF_KHR_binary_glTF} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';

import {GLTFIterator} from '../api/gltf-iterator';

const KHR_BINARY_GLTF = 'KHR_binary_glTF';

/** Extension name */
export const name = KHR_BINARY_GLTF;

export function preprocess(gltfData: GLTFWithBuffers): void {
  const iterator = new GLTFIterator(gltfData);

  // Note: json.buffers.binary_glTF also needs to be replaced
  // This is currently done during gltf normalization

  // Image and shader nodes can have the extension
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/image.KHR_binary_glTF.schema.json
  for (const image of iterator.images) {
    const extension = image.getExtension<GLTF_KHR_binary_glTF>(KHR_BINARY_GLTF);
    // The data in the extension is valid as glTF 2.0 data inside the object, so just copy it in
    if (extension) {
      Object.assign(image.data, extension);
    }
    image.removeExtension(KHR_BINARY_GLTF);
  }

  // TODO shaders - At least traverse and throw error if used?
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/shader.KHR_binary_glTF.schema.json

  // glTF v1 one files have a partially formed URI field that is not expected in (and causes problems in) 2.0
  if (iterator.data.buffers && iterator.data.buffers[0]) {
    delete iterator.data.buffers[0].uri;
  }

  // Remove the top-level extension as it has now been processed
  iterator.removeExtension(KHR_BINARY_GLTF);
}

// KHR_binary_gltf is a 1.0 extension that is supported natively by 2.0
// export function encode() {
//   throw new Error(KHR_BINARY_GLTF);
// }
