import GLTFScenegraph from '../gltf-scenegraph';
import {KHR_LIGHTS_PUNCTUAL} from '../gltf-constants';
import assert from '../utils/assert';

// GLTF EXTENSION: KHR_lights_punctual
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
// eslint-disable-next-line camelcase
export default class KHR_lights_punctual {
  static get name() {
    return KHR_LIGHTS_PUNCTUAL;
  }

  static decode(gltfData, options) {
    const gltfScenegraph = new GLTFScenegraph(gltfData);

    // Move the light array out of the extension and remove the extension
    const extension = gltfScenegraph.getExtension(KHR_LIGHTS_PUNCTUAL);
    if (extension) {
      gltfScenegraph.json.lights = extension.lights;
      gltfScenegraph.removeExtension(KHR_LIGHTS_PUNCTUAL);
    }

    // Any nodes that have the extension, add lights field pointing to light object
    // and remove the extension
    for (const node of gltfScenegraph.nodes || []) {
      const nodeExtension = node.extensions && node.extensions.KHR_lights_punctual;
      if (nodeExtension) {
        node.light = gltfScenegraph._get('lights', nodeExtension.light);
        delete node.extensions.KHR_lights_punctual;
      }
    }
  }

  // Move the light ar ray out of the extension and remove the extension
  static encode(gltfData, options) {
    const gltfScenegraph = new GLTFScenegraph(gltfData);
    const {json} = gltfScenegraph;

    if (json.lights) {
      const extension = gltfScenegraph.addExtensions(KHR_LIGHTS_PUNCTUAL);
      assert(!extension.lights);
      extension.lights = json.lights;
      delete json.lights;
    }

    // Any nodes that have lights field pointing to light object
    // add the extension
    if (gltfScenegraph.json.lights) {
      for (const light of gltfScenegraph.json.lights) {
        const node = light.node;
        gltfScenegraph.addObjectExtension(node, KHR_LIGHTS_PUNCTUAL, light);
      }
      delete gltfScenegraph.json.lights;
    }
  }
}
