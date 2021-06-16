// GLTF 1.0 EXTENSION: KHR_binary_glTF
// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF

import type {GLTF} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import GLTFScenegraph from '../api/gltf-scenegraph';
import {KHR_BINARY_GLTF} from '../gltf-utils/gltf-constants';

export function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): void {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Note: json.buffers.binary_glTF also needs to be replaced
  // This is currently done during gltf normalization

  // Image and shader nodes can have the extension
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/image.KHR_binary_glTF.schema.json
  for (const node of json.images || []) {
    const extension = gltfScenegraph.removeObjectExtension(node, KHR_BINARY_GLTF);
    // The data in the extension is valid as glTF 2.0 data inside the object, so just copy it in
    if (extension) {
      Object.assign(node, extension);
    }
  }

  // TODO shaders
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/1.0/Khronos/KHR_binary_glTF/schema/shader.KHR_binary_glTF.schema.json

  // glTF v1 one files have a partially formed URI field that is not expected in (and causes problems in) 2.0
  if (json.buffers && json.buffers[0]) {
    delete json.buffers[0].uri;
  }

  // Remove the top-level extension as it has now been removed from all nodes
  gltfScenegraph.removeExtension(KHR_BINARY_GLTF);
}

// KHR_binary_gltf is a 1.0 extension that is supported natively by 2.0
export function encode(gltfData, options) {
  throw new Error(KHR_BINARY_GLTF);
}
