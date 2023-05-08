/* eslint-disable camelcase */

import {ImageType} from '@loaders.gl/images';

// Export renamed auto generated types
import type {
  GLTF,
  GLTFAccessor,
  GLTFBuffer,
  GLTFBufferView,
  // GLTFCamera,
  GLTFMeshPrimitive,
  GLTFMesh,
  GLTFNode,
  GLTFMaterial,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture,
  GLTFImage,
//   GLTF_KHR_binary_glTF,
//   GLTF_KHR_draco_mesh_compression,
//   GLTF_KHR_texture_basisu,
//   GLTF_EXT_meshopt_compression,
//   GLTF_EXT_texture_webp,
//   GLTF_EXT_feature_metadata
} from './gltf-json-schema';

export type GLTFObject =
  | GLTFAccessor
  | GLTFBuffer
  | GLTFBufferView
  | GLTFMeshPrimitive
  | GLTFMesh
  | GLTFNode
  | GLTFMaterial
  | GLTFSampler
  | GLTFScene
  | GLTFSkin
  | GLTFTexture
  | GLTFImage;

// import type {
//   GLTFPostprocessed,
//   GLTFAccessorPostprocessed,
//   GLTFImagePostprocessed,
//   GLTFMeshPostprocessed,
//   // GLTFMeshPrimitivePostprocessed,
//   GLTFMaterialPostprocessed,
//   GLTFNodePostprocessed,
//   GLTFTexturePostprocessed
// } from './gltf-postprocessed-schema';

/** GLTFLoader removes processed extensions from `extensionsUsed` and `extensionsUsed`
 * `processedExtensions` is used to track those extensions
 */
export type GLTFWithBuffers = {
  json: GLTF;
  binary?: ArrayBuffer;
  buffers: GLTFExternalBuffer[];
  images?: GLTFExternalImage[];
};

type GLTFExternalBuffer = {
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  byteLength: number
};

type GLTFExternalImage = ImageType | {
  compressed: true,
  mipmaps: false,
  width: number,
  height: number,
  data: Uint8Array
};  

// export type {
//   GLTF,
//   GLTFAccessor,
//   GLTFBuffer,
//   GLTFBufferView,
//   GLTFCamera,
//   GLTFMeshPrimitive,
//   GLTFMesh,
//   GLTFNode,
//   GLTFMaterial,
//   GLTFSampler,
//   GLTFScene,
//   GLTFSkin,
//   GLTFTexture,
//   GLTFImage,
//   GLTF_KHR_binary_glTF,
//   GLTF_KHR_draco_mesh_compression,
//   GLTF_KHR_texture_basisu,
//   GLTF_EXT_meshopt_compression,
//   GLTF_EXT_texture_webp,
//   GLTF_EXT_feature_metadata
// }

// export type {
//   GLTFPostprocessed,
//   GLTFAccessorPostprocessed,
//   GLTFImagePostprocessed,
//   GLTFNodePostprocessed,
//   GLTFMeshPostprocessed,
//   // GLTFMeshPrimitivePostprocessed,
//   GLTFMaterialPostprocessed,
//   GLTFTexturePostprocessed,
// };

