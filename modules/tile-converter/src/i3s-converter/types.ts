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

/**
 * 3DTilesNext EXT_feature_metadata extension
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 */
export type ExtFeatureMetadata = {
  /** Feature ids definition in attributes */
  featureIdAttributes?: ExtFeatureMetadataAttribute[];
  /** Feature ids definition in textures */
  featureIdTextures?: ExtFeatureMetadataAttribute[];
};

/**
 * Attribute which described featureIds definition.
 */
export type ExtFeatureMetadataAttribute = {
  /** Name of feature table */
  featureTable: string;
  /** Described how feature ids are defined */
  featureIds: ExtFeatureMetadataFeatureIds;
};

/**
 * Defining featureIds by attributes or implicitly.
 */
type ExtFeatureMetadataFeatureIds = {
  /** Name of attribute where featureIds are defined */
  attribute?: string;
  /** Sets a constant feature ID for each vertex. The default is 0. */
  constant?: number;
  /** Sets the rate at which feature IDs increment.
   * If divisor is zero then constant is used.
   * If divisor is greater than zero the feature ID increments once per divisor sets of vertices, starting at constant.
   * The default is 0
   */
  divisor?: number;
  /** gLTF textureInfo object - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/specification/2.0/schema/textureInfo.schema.json */
  texture?: ExtFeatureMetadataTexture;
  /** Must be a single channel ("r", "g", "b", or "a") */
  channels?: 'r' | 'g' | 'b' | 'a';
};

/**
 * Reference to a texture.
 */
type ExtFeatureMetadataTexture = {
  /** The set index of texture's TEXCOORD attribute used for texture coordinate mapping.*/
  texCoord: number;
  /** The index of the texture. */
  index: number;
};
