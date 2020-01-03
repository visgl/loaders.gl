// GLTF EXTENSION: KHR_materials_unlit
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit

import GLTFScenegraph from '../gltf-scenegraph';
import {KHR_MATERIALS_UNLIT} from '../gltf-constants';

export function decode(gltfData, options) {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Remove the top-level extension
  gltfScenegraph.removeExtension(KHR_MATERIALS_UNLIT);

  // Any nodes that have the extension, add lights field pointing to light object
  // and remove the extension
  for (const material of json.materials || []) {
    const extension = material.extensions && material.extensions.KHR_materials_unlit;
    if (extension) {
      material.unlit = true;
    }
    gltfScenegraph.removeObjectExtension(material, KHR_MATERIALS_UNLIT);
  }
}

export function encode(gltfData, options) {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Any nodes that have lights field pointing to light object
  // add the extension
  if (gltfScenegraph.materials) {
    for (const material of json.materials) {
      if (material.unlit) {
        delete material.unlit;
        gltfScenegraph.addObjectExtension(material, KHR_MATERIALS_UNLIT);
        gltfScenegraph.addExtension(KHR_MATERIALS_UNLIT);
      }
    }
  }
}
