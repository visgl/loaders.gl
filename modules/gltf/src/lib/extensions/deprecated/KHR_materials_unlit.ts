// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: KHR_materials_unlit
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit

import type {GLTFWithBuffers} from '../../types/gltf-types';

import {GLTFIterator} from '../../api/gltf-iterator';
import {GLTFScenegraph} from '../../api/gltf-scenegraph';

const KHR_MATERIALS_UNLIT = 'KHR_materials_unlit';

export const name = KHR_MATERIALS_UNLIT;

export async function decode(gltfData: GLTFWithBuffers): Promise<void> {
  const iterator = new GLTFIterator(gltfData);

  // Any nodes that have the extension, add lights field pointing to light object
  // and remove the extension
  for (const material of iterator.materials) {
    const extension = iterator.getExtension(material, KHR_MATERIALS_UNLIT);
    if (extension) {
      // @ts-ignore TODO
      (material as typeof material & {unlit?: boolean}).unlit = true;
    }
    iterator.removeExtension(material, KHR_MATERIALS_UNLIT);
  }

  // Remove the top-level extension
  iterator.removeExtension(KHR_MATERIALS_UNLIT);
}

export function encode(gltfData) {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Any nodes that have lights field pointing to light object
  // add the extension
  // @ts-ignore
  if (gltfScenegraph.materials) {
    for (const material of json.materials || []) {
      // @ts-ignore
      if (material.unlit) {
        // @ts-ignore
        delete material.unlit;
        gltfScenegraph.addObjectExtension(material, KHR_MATERIALS_UNLIT, {});
        gltfScenegraph.addExtension(KHR_MATERIALS_UNLIT);
      }
    }
  }
}
