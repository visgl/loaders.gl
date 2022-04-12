import {
  BoundingVolumes,
  I3SMaterialDefinition,
  MaterialDefinitionInfo,
  TextureDefinitionInfo
} from '@loaders.gl/i3s';
import {ImageDataType} from '@loaders.gl/images';

/** Converted resources for specific node */
export type I3SConvertedResources = {
  /** Non-compressed geometry buffer that have structure met
   * https://github.com/Esri/i3s-spec/blob/master/docs/1.8/defaultGeometrySchema.cmn.md
   * (Geometry buffer)
   */
  geometry: ArrayBuffer | null;
  /**
   * Draco compressed geometry
   */
  compressedGeometry?: Promise<ArrayBuffer> | null;
  /**
   * Texture image content
   */
  texture: any | null;
  /**
   * Shared resources built from GLTF material
   */
  sharedResources: SharedResourcesArrays | null;
  /**
   * Material definition of the node
   */
  meshMaterial?: I3SMaterialDefinition | null;
  /**
   * Number of vertices in the node
   */
  vertexCount: number | null;
  /**
   * Feature attributes contents
   */
  attributes: ArrayBuffer[] | null;
  /**
   * Number of features in the node
   */
  featureCount: number | null;
  /**
   * MBS and/or OBB bounding volumes of the node
   */
  boundingVolumes: BoundingVolumes | null;
};

/**
 * Geometry and feature attributes converted from GLTF primitives
 */
export type ConvertedAttributes = {
  /** POSITION attribute value */
  positions: Float32Array;
  /** NORMAL attribute value */
  normals: Float32Array;
  /** TEXCOORD_0 attribute value */
  texCoords: Float32Array;
  /** COLOR_0 attribute value */
  colors: Uint8Array;
  /** Feature indices grouped by ...
   * converted from "batch ids" of GLTF
   */
  featureIndicesGroups?: number[][];
  /** Feature indices converted from "batch ids" */
  featureIndices: number[];
  /**
   * MBS and/or OBB bounding volumes of the node
   */
  boundingVolumes: null | BoundingVolumes;
};

/** Postprocessed geometry and feature attributes
 * https://github.com/Esri/i3s-spec/blob/master/docs/1.8/defaultGeometrySchema.cmn.md
 */
export type GeometryAttributes = {
  /** POSITION attribute value */
  positions: Float32Array;
  /** NORMAL attribute value */
  normals: Float32Array;
  /** TEXCOORD_0 attribute value */
  texCoords: Float32Array;
  /** COLOR_0 attribute value */
  colors: Uint8Array;
  /** faceRanges attribute value  */
  faceRange: Uint32Array;
  /** feature Ids attribute value */
  featureIds: number[];
  /** number of features in the node */
  featureCount: number;
};

/** Geometry attributes specific for the particular feature */
export type GroupedByFeatureIdAttributes = {
  /** Feature Id */
  featureId: number;
  /** POSITION attribute value */
  positions: Float32Array;
  /** NORMAL attribute value */
  normals: Float32Array;
  /** COLOR_0 attribute value */
  colors: Uint8Array;
  /** TEXCOORD_0 attribute value */
  texCoords: Float32Array;
};

/** Shared resources made from GLTF material */
export type SharedResourcesArrays = {
  /** material definitions list https://github.com/Esri/i3s-spec/blob/master/docs/1.8/materialDefinitionInfo.cmn.md */
  materialDefinitionInfos?: MaterialDefinitionInfo[];
  /** texture definitions list  https://github.com/Esri/i3s-spec/blob/master/docs/1.8/textureDefinitionInfo.cmn.md*/
  textureDefinitionInfos?: TextureDefinitionInfo[];
  /** node id to make unique SharedResource ids */
  nodePath?: string;
};

/** I3S material definition and texture content taken from GLTF material */
export type I3SMaterialWithTexture = {
  /** Material definition https://github.com/Esri/i3s-spec/blob/master/docs/1.8/materialDefinitions.cmn.md */
  material: I3SMaterialDefinition;
  /** Texture content (image) */
  texture?: ImageDataType;
};
