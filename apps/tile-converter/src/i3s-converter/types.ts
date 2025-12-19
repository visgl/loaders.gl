import {GLTFImagePostprocessed, GLTFNodePostprocessed} from '@loaders.gl/gltf';
import {
  BoundingVolumes,
  I3SMaterialDefinition,
  MaterialDefinitionInfo,
  TextureDefinitionInfo
} from '@loaders.gl/i3s';
import {Matrix4, Vector3} from '@math.gl/core';

/** Converted resources for specific node */
export type I3SConvertedResources = {
  /**
   * Node id
   */
  nodeId?: number;
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
   * If the resource has uvRegions geometry attribute
   */
  hasUvRegions: boolean;
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
  /** uvRegion attribute for a texture atlas */
  uvRegions: Uint16Array;
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
  /** merged materials data */
  mergedMaterials: MergedMaterial[];
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
  /** uvRegion attribute for a texture atlas */
  uvRegions: Uint16Array;
  /** faceRanges attribute value  */
  faceRange: Uint32Array;
  /** feature Ids attribute value */
  featureIds: number[];
  /** number of features in the node */
  featureCount: number;
};

/** Geometry attributes applicable for reordering by featureId */
export type GroupedAttributes = {
  /** POSITION attribute value */
  positions: Float32Array;
  /** NORMAL attribute value */
  normals: Float32Array;
  /** COLOR_0 attribute value */
  colors: Uint8Array;
  /** uvRegion attribute for a texture atlas */
  uvRegions: Uint16Array;
  /** TEXCOORD_0 attribute value */
  texCoords: Float32Array;
};

/** Geometry attributes specific for the particular feature */
export type GroupedByFeatureIdAttributes = GroupedAttributes & {
  /** Feature Id */
  featureId: number;
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
  texture?: GLTFImagePostprocessed;
  /** Metadata of all merged materials */
  mergedMaterials: MergedMaterial[];
};

/** Metadata of some original texture */
export type MergedMaterial = {
  /** Gltf material Id */
  originalMaterialId: string;
  /** Original texture size */
  textureSize?: {
    width: number;
    height: number;
  };
  /** Uint16Array of 4 elements https://github.com/Esri/i3s-spec/blob/master/docs/1.7/geometryUVRegion.cmn.md */
  uvRegion?: Uint16Array;
};

export type TypedArrayConstructor =
  | Uint8ArrayConstructor
  | Int8ArrayConstructor
  | Uint16ArrayConstructor
  | Int16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

/**
 * glTF primitive modes (mesh topology types)
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_mesh_primitive_mode
 */
export enum GLTFPrimitiveModeString {
  POINTS = 'POINTS',
  LINES = 'LINES',
  LINE_LOOP = 'LINE_LOOP',
  LINE_STRIP = 'LINE_STRIP',
  TRIANGLES = 'TRIANGLES',
  TRIANGLE_STRIP = 'TRIANGLE_STRIP',
  TRIANGLE_FAN = 'TRIANGLE_FAN'
}

/** Preprocessed data gathered from child tiles binary content */
export type PreprocessData = {
  /** Mesh topology types used in gltf primitives of the tileset */
  meshTopologyTypes: Set<GLTFPrimitiveModeString>;
  /**
   * Feature metadata classes found in glTF extensions
   * The tileset might contain multiple metadata classes provided by EXT_feature_metadata and EXT_structural_metadata extensions.
   * Every class is a set of properties. But I3S can consume only one set of properties.
   * On the pre-process we collect all classes from the tileset in order to show the prompt to select one class for conversion to I3S.
   */
  metadataClasses: Set<string>;
};

/** Texture image properties required for conversion */
export type TextureImageProperties = {
  /** Array with image data */
  data: Uint8Array;
  /** Is the texture compressed */
  compressed?: boolean;
  /** Height of the texture's image */
  height?: number;
  /** Width of the texture's image */
  width?: number;
  /** Number of components (3 for RGB, 4 for RGBA) */
  components?: number;
  /** Mime type of the texture's image */
  mimeType?: string;
};

/** glTF attributes data, prepared for conversion */
export type GLTFAttributesData = {
  /** glTF PBR materials (only id is required) */
  gltfMaterials?: {id: string}[];
  /** glTF geometry nodes */
  nodes: GLTFNodePostprocessed[];
  /** glTF texture images (set to null for compressed textures) */
  images: (null | TextureImageProperties)[];
  /** Source tile origin coordinates in cartographic coordinate system */
  cartographicOrigin: Vector3;
  /** Model matrix to convert coordinate system of POSITION and NORMAL attributes from METER_OFFSETS to CARTESIAN  */
  cartesianModelMatrix: Matrix4;
};

/**
 * I3S' types difine the following:
 *   type Attribute = 'OBJECTID' | 'string' | 'double' | 'Int32' | string;
 * The AttributeType contains the string values of the Attribute type.
 */
export const AttributeType = {
  /** Type of attribute that is linked with feature ids */
  OBJECT_ID_TYPE: 'OBJECTID',
  /** String data type name for feature attributes */
  STRING_TYPE: 'string',
  /** Double data type name for feature attributes */
  DOUBLE_TYPE: 'double',
  /** Integer data type name for feature attributes */
  SHORT_INT_TYPE: 'Int32'
} as const;

export enum ResourceType {
  ATTRIBUTES = 'ATTRIBUTES',
  DRACO_GEOMETRY = 'DRACO_GEOMETRY',
  GEOMETRY = 'GEOMETRY',
  SHARED = 'SHARED',
  TEXTURE = 'TEXTURE'
}
