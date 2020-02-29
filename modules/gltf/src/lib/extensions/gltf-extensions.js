/* eslint-disable camelcase */
import * as KHR_draco_mesh_compression from './KHR_draco_mesh_compression';
import * as KHR_lights_punctual from './KHR_lights_punctual';
import * as KHR_materials_unlit from './KHR_materials_unlit';
// import UBER_POINT_CLOUD_COMPRESSION from './KHR_draco_mesh_compression';
import * as KHR_techniques_webgl from './KHR_techniques_webgl';

export const EXTENSIONS = {
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
