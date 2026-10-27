// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: KHR_materials_unlit
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit

import type {GLTFWithBuffers} from '../../types/gltf-types';
import type {GLTF, GLTFMaterial} from '../../types/gltf-json-schema';

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

/** Restore decoded unlit annotations for export, requiring consumers to preserve their shading. */
export function encode(gltfData: {json: GLTF}): void {
  const scenegraph = new GLTFScenegraph(gltfData);
  for (const material of gltfData.json.materials || []) {
    const decodedMaterial = material as GLTFMaterial & {
      /** Deprecated loader annotation indicating lighting-independent shading. */
      unlit?: boolean;
    };
    if (decodedMaterial.unlit) {
      delete decodedMaterial.unlit;
      scenegraph.addObjectExtension(material, KHR_MATERIALS_UNLIT, {});
      scenegraph.registerRequiredExtension(KHR_MATERIALS_UNLIT);
    }
  }
  for (const field of ['extensionsUsed', 'extensionsRequired'] as const)
    if (gltfData.json[field]?.length === 0) delete gltfData.json[field];
}
