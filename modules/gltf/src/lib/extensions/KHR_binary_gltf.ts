// GLTF 1.0 EXTENSION: KHR_binary_glTF
// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
/* eslint-disable camelcase */

import type {GLTF, GLTF_KHR_binary_glTF} from '../types/gltf-types';

import GLTFScenegraph from '../api/gltf-scenegraph';

const KHR_BINARY_GLTF = 'KHR_binary_glTF';

/** Extension name */
export const name = KHR_BINARY_GLTF;

export function preprocess(gltfData: {json: GLTF}): void {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Note: json.buffers.binary_glTF also needs to be replaced
  // This is currently done during gltf normalization

  // Image and shader nodes can have the extension
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/image.KHR_binary_glTF.schema.json
  for (const image of json.images || []) {
    const extension = gltfScenegraph.getObjectExtension<GLTF_KHR_binary_glTF>(
      image,
      KHR_BINARY_GLTF
    );
    // The data in the extension is valid as glTF 2.0 data inside the object, so just copy it in
    if (extension) {
      Object.assign(image, extension);
    }
    gltfScenegraph.removeObjectExtension(image, KHR_BINARY_GLTF);
  }

  // TODO shaders - At least traverse and throw error if used?
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/shader.KHR_binary_glTF.schema.json

  // glTF v1 one files have a partially formed URI field that is not expected in (and causes problems in) 2.0
  if (json.buffers && json.buffers[0]) {
    delete json.buffers[0].uri;
  }

  // Remove the top-level extension as it has now been processed
  gltfScenegraph.removeExtension(KHR_BINARY_GLTF);
}

// KHR_binary_gltf is a 1.0 extension that is supported natively by 2.0
// export function encode() {
//   throw new Error(KHR_BINARY_GLTF);
// }
