// GLTF EXTENSION: KHR_lights_punctual
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual

import type {GLTF} from '../../types/gltf-types';

import {assert} from '../../utils/assert';
import GLTFScenegraph from '../../api/gltf-scenegraph';

const KHR_LIGHTS_PUNCTUAL = 'KHR_lights_punctual';

export const name = KHR_LIGHTS_PUNCTUAL;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // Move the light array out of the extension and remove the extension
  const extension = gltfScenegraph.getExtension(KHR_LIGHTS_PUNCTUAL);
  if (extension) {
    // @ts-ignore
    gltfScenegraph.json.lights = extension.lights;
    gltfScenegraph.removeExtension(KHR_LIGHTS_PUNCTUAL);
  }

  // Any nodes that have the extension, add lights field pointing to light object
  // and remove the extension
  for (const node of json.nodes || []) {
    const nodeExtension = gltfScenegraph.getObjectExtension(node, KHR_LIGHTS_PUNCTUAL);
    if (nodeExtension) {
      // @ts-ignore
      node.light = nodeExtension.light;
    }
    gltfScenegraph.removeObjectExtension(node, KHR_LIGHTS_PUNCTUAL);
  }
}

// Move the light ar ray out of the extension and remove the extension
export async function encode(gltfData): Promise<void> {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  // @ts-ignore
  if (json.lights) {
    const extension = gltfScenegraph.addExtension(KHR_LIGHTS_PUNCTUAL);
    // @ts-ignore
    assert(!extension.lights);
    // @ts-ignore
    extension.lights = json.lights;
    // @ts-ignore
    delete json.lights;
  }

  // Any nodes that have lights field pointing to light object
  // add the extension
  // @ts-ignore
  if (gltfScenegraph.json.lights) {
    // @ts-ignore
    for (const light of gltfScenegraph.json.lights) {
      const node = light.node;
      gltfScenegraph.addObjectExtension(node, KHR_LIGHTS_PUNCTUAL, light);
    }
    // @ts-ignore
    delete gltfScenegraph.json.lights;
  }
}
