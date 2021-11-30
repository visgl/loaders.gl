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
  GLTF_EXT_texture_webp
} from './gltf-json-schema';

import type {Image as GLTFImagePostprocessed} from './gltf-postprocessed-schema';

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
  GLTFImagePostprocessed
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

export type GLTFWithBuffers = {
  json: GLTF;
  buffers: any[];
  binary?: ArrayBuffer;
  images?: any[];
};
