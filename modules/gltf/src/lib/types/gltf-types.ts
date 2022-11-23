/* eslint-disable camelcase */

// Export renamed auto generated types
import type {
  GLTF,
  Accessor as GLTFAccessor,
  Buffer as GLTFBuffer,
  BufferView as GLTFBufferView,
  MeshPrimitive as GLTFMeshPrimitive,
  Mesh as GLTFMesh,
  Node as GLTFNode,
  Material as GLTFMaterial,
  Sampler as GLTFSampler,
  Scene as GLTFScene,
  Skin as GLTFSkin,
  Texture as GLTFTexture,
  Image as GLTFImage,
  GLTF_KHR_binary_glTF,
  GLTF_KHR_draco_mesh_compression,
  GLTF_KHR_texture_basisu,
  GLTF_EXT_meshopt_compression,
  GLTF_EXT_texture_webp,
  GLTF_EXT_feature_metadata
} from './gltf-json-schema';

import type {
  GLTF as GLTFPostprocessed,
  Accessor as GLTFAccessorPostprocessed,
  Image as GLTFImagePostprocessed,
  Mesh as GLTFMeshPostprocessed,
  MeshPrimitive as GLTFMeshPrimitivePostprocessed,
  Material as GLTFMaterialPostprocessed,
  Node as GLTFNodePostprocessed,
  Texture as GLTFTexturePostprocessed
} from './gltf-postprocessed-schema';

export type {
  GLTF,
  GLTFAccessor,
  GLTFBuffer,
  GLTFBufferView,
  GLTFMeshPrimitive,
  GLTFMesh,
  GLTFNode,
  GLTFMaterial,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture,
  GLTFImage,
  GLTF_KHR_binary_glTF,
  GLTF_KHR_draco_mesh_compression,
  GLTF_KHR_texture_basisu,
  GLTF_EXT_meshopt_compression,
  GLTF_EXT_texture_webp,
  GLTFPostprocessed,
  GLTFAccessorPostprocessed,
  GLTFImagePostprocessed,
  GLTFNodePostprocessed,
  GLTFMeshPostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFMaterialPostprocessed,
  GLTFTexturePostprocessed,
  GLTF_EXT_feature_metadata
};

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

/** GLTFLoader removes processed extensions from `extensionsUsed` and `extensionsUsed`
 * `processedExtensions` is used to track those extensions
 */
export type GLTFWithBuffers = {
  json: GLTF;
  buffers: any[];
  binary?: ArrayBuffer;
  images?: any[];
};
