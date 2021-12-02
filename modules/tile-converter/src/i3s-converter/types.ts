import {BoundingVolumes, I3SMaterialDefinition, SharedResources} from '@loaders.gl/i3s';

export type I3SConvertedResources = {
  geometry: ArrayBuffer | null;
  compressedGeometry?: ArrayBuffer | null;
  texture: any | null;
  sharedResources: SharedResources | null;
  meshMaterial?: I3SMaterialDefinition | null;
  vertexCount: number | null;
  attributes: any | null;
  featureCount: number | null;
  geometryBuffer?: ArrayBuffer;
  boundingVolumes: BoundingVolumes | null;
};
