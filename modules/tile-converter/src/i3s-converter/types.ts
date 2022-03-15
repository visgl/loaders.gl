import {
  BoundingVolumes,
  I3SMaterialDefinition,
  MaterialDefinitionInfo,
  TextureDefinitionInfo
} from '@loaders.gl/i3s';

export type I3SConvertedResources = {
  geometry: ArrayBuffer | null;
  compressedGeometry?: ArrayBuffer | null;
  texture: any | null;
  sharedResources: SharedResourcesArrays | null;
  meshMaterial?: I3SMaterialDefinition | null;
  vertexCount: number | null;
  attributes: any | null;
  featureCount: number | null;
  geometryBuffer?: ArrayBuffer;
  boundingVolumes: BoundingVolumes | null;
};

export type ConvertedAttributes = {
  positions: Float32Array;
  normals: Float32Array;
  texCoords: Float32Array;
  colors: Uint8Array;
  featureIndicesGroups?: number[][];
  featureIndices: number[];
  boundingVolumes: null | BoundingVolumes;
};

export type AttributesData = {
  positions: Float32Array;
  normals: Float32Array;
  texCoords: Float32Array;
  colors: Uint8Array;
  featureIndices: number[];
  triangleCount: number;
  boundingVolumes?: BoundingVolumes | null;
};

export type GeometryAttributes = {
  positions: Float32Array;
  normals: Float32Array;
  texCoords: Float32Array;
  colors: Uint8Array;
  faceRange: Uint32Array;
  featureIds: number[];
  featureCount: number;
};

export type GroupedByFeatureIdAttributes = {
  featureId: number;
  positions: Float32Array;
  normals: Float32Array;
  colors: Uint8Array;
  texCoords: Float32Array;
};

export type SharedResourcesArrays = {
  materialDefinitionInfos?: MaterialDefinitionInfo[];
  textureDefinitionInfos?: TextureDefinitionInfo[];
  nodePath?: string;
};

export type I3SMaterialWithTexture = {
  material: I3SMaterialDefinition;
  texture?: {};
};
