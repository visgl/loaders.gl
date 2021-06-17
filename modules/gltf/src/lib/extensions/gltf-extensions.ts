/* eslint-disable camelcase */
import {GLTF} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

// GLTF 1.0 extensions (read only)
// import * as KHR_binary_gltf from './KHR_draco_mesh_compression';

// GLTF 2.0 extensions (read/write)
import * as KHR_draco_mesh_compression from './KHR_draco_mesh_compression';
import * as KHR_materials_unlit from './KHR_materials_unlit';
import * as KHR_lights_punctual from './KHR_lights_punctual';
import * as KHR_techniques_webgl from './KHR_techniques_webgl';

type GLTFExtensionPlugin = {
  decode: (gltfData: {json: GLTF}, options: GLTFLoaderOptions, context) => Promise<void>;

  encode: (gltfData: {json: GLTF}, options: GLTFLoaderOptions) => void;
};

/**
 * List of extensions processed by the GLTFLoader
 * Note that may extensions can only be handled on the rendering stage and are left out here
 * These are just extensions that can be handled fully or partially during loading.
 */
export const EXTENSIONS: {[extensionName: string]: GLTFExtensionPlugin} = {
  // 1.0
  // KHR_binary_gltf is handled separately - must be processed before other parsing starts
  // KHR_binary_gltf,

  // 2.0
  KHR_draco_mesh_compression,
  KHR_materials_unlit,
  KHR_lights_punctual,
  KHR_techniques_webgl
};

export async function decodeExtensions(gltf, options: GLTFLoaderOptions = {}, context) {
  for (const extensionName in EXTENSIONS) {
    const excludes = options?.gltf?.excludeExtensions || {};
    const exclude = extensionName in excludes && !excludes[extensionName];
    if (!exclude) {
      const extension = EXTENSIONS[extensionName];
      // Note: We decode async extensions sequentially, this might not be necessary
      // Currently we only have Draco, but when we add Basis we may revisit
      await extension.decode(gltf, options, context);
    }
  }
}
