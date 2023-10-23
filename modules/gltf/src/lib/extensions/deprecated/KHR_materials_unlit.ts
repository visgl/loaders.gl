// GLTF EXTENSION: KHR_materials_unlit
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit

import type {GLTF} from '../../types/gltf-json-schema';

import {GLTFScenegraph} from '../../api/gltf-scenegraph';

const KHR_MATERIALS_UNLIT = 'KHR_materials_unlit';

export const name = KHR_MATERIALS_UNLIT;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Any nodes that have the extension, add lights field pointing to light object
  // and remove the extension
  for (const material of json.materials || []) {
    const extension = material.extensions && material.extensions.KHR_materials_unlit;
    if (extension) {
      // @ts-ignore TODO
      material.unlit = true;
    }
    gltfScenegraph.removeObjectExtension(material, KHR_MATERIALS_UNLIT);
  }

  // Remove the top-level extension
  gltfScenegraph.removeExtension(KHR_MATERIALS_UNLIT);
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
