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

/** Convert embedded glTF 1 images and the named binary body to core glTF 2 fields. */
export function preprocess(gltfData: GLTFWithBuffers): void {
  const iterator = new GLTFIterator(gltfData);

  // Note: json.buffers.binary_glTF also needs to be replaced
  // This is currently done during gltf normalization

  // Image and shader nodes can have the extension
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/image.KHR_binary_glTF.schema.json
  for (const image of iterator.images) {
    const extension = iterator.getExtension<GLTF_KHR_binary_glTF>(image, KHR_BINARY_GLTF);
    // Copy core image fields, omitting extension-only dimensions.
    if (extension) {
      image.bufferView = extension.bufferView;
      image.mimeType = extension.mimeType;
      delete image.uri;
    }
    iterator.removeExtension(image, KHR_BINARY_GLTF);
  }

  // TODO shaders - At least traverse and throw error if used?
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/shader.KHR_binary_glTF.schema.json

  // Only the reserved GLB body has an ignored URI; external buffers retain theirs.
  for (const buffer of iterator.data.buffers || []) {
    if ((buffer as typeof buffer & {id?: string}).id === 'binary_glTF') {
      delete buffer.uri;
    }
  }

  // Remove the top-level extension as it has now been processed
  iterator.removeExtension(KHR_BINARY_GLTF);
}

// KHR_binary_gltf is a 1.0 extension that is supported natively by 2.0
// export function encode() {
//   throw new Error(KHR_BINARY_GLTF);
// }
