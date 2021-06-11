/* eslint-disable camelcase */

// GLTF 1.0 extensions (read only)
// import * as KHR_binary_gltf from './KHR_draco_mesh_compression';

// GLTF 2.0 extensions (read/write)
import * as KHR_draco_mesh_compression from './KHR_draco_mesh_compression';
import * as KHR_lights_punctual from './KHR_lights_punctual';
import * as KHR_materials_unlit from './KHR_materials_unlit';
import * as KHR_techniques_webgl from './KHR_techniques_webgl';

/**
 * List of extensions processed by the GLTFLoader
 * Note that may extensions can only be handled on the rendering stage and are left out here
 * These are just extensions that can be handled fully or partially during loading.
 */
export const EXTENSIONS = {
  // 1.0
  // KHR_binary_gltf is handled separately - must be processed before other parsing starts
  // KHR_binary_gltf,

  // 2.0
  KHR_draco_mesh_compression,
  KHR_lights_punctual,
  KHR_materials_unlit,
  KHR_techniques_webgl
};

export async function decodeExtensions(gltf, options = {}, context) {
  options.gltf = options.gltf || {};
  for (const extensionName in EXTENSIONS) {
    const excludes = options.gltf.excludeExtensions || {};
    const exclude = extensionName in excludes && !excludes[extensionName];
    if (!exclude) {
      const extension = EXTENSIONS[extensionName];
      // Note: We decode async extensions sequentially, this might not be necessary
      // Currently we only have Draco, but when we add Basis we may revisit
      await extension.decode(gltf, options, context);
    }
  }
}
