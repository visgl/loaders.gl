import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Matrix4, Vector3} from '@math.gl/core';

export type FeatureTableJson = {
  [key: string]: any[];
};

export type B3DMContent = {
  batchTableJson?: FeatureTableJson;
  byteLength: number;
  byteOffset: number;
  cartesianModelMatrix: Matrix4;
  cartesianOrigin: Vector3;
  cartographicModelMatrix: Matrix4;
  cartographicOrigin: Vector3;
  featureIds?: number[] | null;
  featureTableBinary?: Uint8Array;
  featureTableJson?: FeatureTableJson;
  gltf?: GLTFPostprocessed;
  gltfUpAxis: string;
  header: GLTFHeader;
  magic: number;
  modelMatrix: Matrix4;
  rotateYtoZ: boolean;
  rtcCenter: [number, number, number];
  type: string;
  version: number;
};

export type GLTFHeader = {
  batchLength?: number;
  batchTableBinaryByteLength: number;
  batchTableJsonByteLength: number;
  featureTableBinaryByteLength: number;
  featureTableJsonByteLength: number;
};

export type Node3D = {
  boundingVolume: BoundingVolume;
  children: any;
  geometricError: number;
  content?: {
    uri: string;
    boundingVolume: BoundingVolume;
  };
};

export type BoundingVolume = {
  box?: number[];
  sphere?: number[];
  region?: number[];
};

/**
 * 3DTILES_implicit_tiling types
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling#subtree-file-format
 */
export type Subtree = {
  buffers: Buffer[];
  bufferViews: BufferView[];
  tileAvailability: Availability;
  contentAvailability: Availability;
  childSubtreeAvailability: Availability;
};

export type Availability = {
  constant?: 0 | 1;
  bufferView?: number;
  // Internal bitstream type
  explicitBitstream?: ExplicitBitstream;
};

export type ExplicitBitstream = Uint8Array;

/**
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling#subdivision-scheme
 */
export type SubdivisionScheme = 'QUADTREE' | 'OCTREE';

type Buffer = {
  name: string;
  uri?: string;
  byteLength: number;
};

type BufferView = {
  buffer: number;
  byteOffset: number;
  byteLength: number;
};

/**
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 */
export type ImplicitTilingExtension = {
  subdivisionScheme: 'QUADTREE' | 'OCTREE';
  maximumLevel?: number;
  availableLevels: number;
  subtreeLevels: number;
  subtrees: SubtreeUri;
};

type SubtreeUri = {
  uri: string;
};
