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
  Image as GLTFImage
} from './gltf-json-schema';

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
  GLTFImage
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

// Extensions

export type GLTF_KHR_draco_mesh_compression = {
  bufferView: number;
  attributes: {[name: string]: number};
  extensions?: any;
  extras?: any;
};

// export type GLTF = {
//   json: GLTFRoot;
//   buffers?: any[];
//   images?: any[];
// }

// export type GLTFWithBuffers = {
//   json: GLTF;
//   buffers: any[];
//   binary?: ArrayBuffer;
// };
