/* eslint-disable camelcase */
import KHR_draco_mesh_compression from './KHR_draco_mesh_compression';
import KHR_lights_punctual from './KHR_lights_punctual';
// import UBER_POINT_CLOUD_COMPRESSION from './KHR_draco_mesh_compression';

export const EXTENSIONS = {
  KHR_draco_mesh_compression,
  KHR_lights_punctual
};

export async function decodeExtensions(gltf, options) {
  for (const extensionName in EXTENSIONS) {
    const disableExtension = extensionName in options && !options[extensionName];
    if (!disableExtension) {
      const extension = EXTENSIONS[extensionName];
      // Note: We decode extensions sequentially, this might not be necessary
      // Currently we only have glTF, but when we add Basis we may revisit
      await extension.decode(gltf, options);
      // TODO - warn if extension cannot be decoded synchronously?
    }
  }
}

export function decodeExtensionsSync(gltf, options) {
  for (const extensionName in EXTENSIONS) {
    const disableExtension = extensionName in options && !options[extensionName];
    if (!disableExtension) {
      const extension = EXTENSIONS[extensionName];
      extension.decodeSync(gltf, options);
    }
  }
}
