import type {GLTFMaterial} from '@loaders.gl/gltf';
import type {Matrix4, Quaternion, Vector3} from '@math.gl/core';
import type {TypedArray, MeshAttribute} from '@loaders.gl/schema';
import type {TextureLevel} from '@loaders.gl/textures/src/types';

export enum DATA_TYPE {
  UInt8 = 'UInt8',
  UInt16 = 'UInt16',
  UInt32 = 'UInt32',
  UInt64 = 'UInt64',
  Int16 = 'Int16',
  Int32 = 'Int32',
  Int64 = 'Int64',
  Float32 = 'Float32',
  Float64 = 'Float64'
}
/**
 * spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/3DSceneLayer.cmn.md
 */
// TODO Replace "[key: string]: any" with actual defenition
export interface I3STilesetHeader extends SceneLayer3D {
  /** Not in spec, but is necessary for woking */
  url?: string;
  [key: string]: any;
}
/** https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePage.cmn.md */
export type NodePage = {
  /** Array of nodes. */
  nodes: NodeInPage[];
};
/**
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/mesh.cmn.md
 */
type NodeMesh = {
  /**
   * The material definition.
   */
  material: MeshMaterial;
  /** The geometry definition. */
  geometry: MeshGeometry;
  /** The attribute set definition. */
  attribute: meshAttribute;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/meshMaterial.cmn.md */
export type MeshMaterial = {
  /** The index in layer.materialDefinitions array. */
  definition: number;
  /** Resource id for the material textures. i.e: layers/0/nodes/{material.resource}/textures/{tex_name}. Is required if material declares any textures. */
  resource?: number;
  /** Estimated number of texel for the highest resolution base color texture. */
  texelCountHint?: number;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/meshGeometry.cmn.md */
export type MeshGeometry = {
  /** The index in layer.geometryDefinitions array */
  definition: number;
  /** The resource locator to be used to query geometry resources: layers/0/nodes/{this.resource}/geometries/{layer.geometryDefinitions[this.definition].geometryBuffers[0 or 1]}. */
  resource: number;
  /** Number of vertices in the geometry buffer of this mesh for the umcompressed mesh buffer. Please note that Draco compressed meshes may have less vertices due to de-duplication (actual number of vertices is part of the Draco binary blob). Default=0 */
  vertexCount?: number;
  /** Number of features for this mesh. Default=0. (Must omit or set to 0 if mesh doesn't use features.) */
  featureCount?: number;
};
/** https://github.com/Esri/i3s-spec/blob/master/docs/1.8/meshAttribute.cmn.md */
type meshAttribute = {
  /** The resource identifier to be used to locate attribute resources of this mesh. i.e. layers/0/nodes/<resource id>/attributes/... */
  resource: number;
};

export type I3STextureFormat = 'jpg' | 'png' | 'ktx-etc2' | 'dds' | 'ktx2';

// TODO Replace "[key: string]: any" with actual defenition
export type I3STileHeader = {
  isDracoGeometry: boolean;
  textureUrl?: string;
  url?: string;
  textureFormat?: I3STextureFormat;
  textureLoaderOptions?: any;
  materialDefinition?: I3SMaterialDefinition;
  mbs: Mbs;
  obb?: Obb;
  lodSelection?: LodSelection[];
  [key: string]: any;
};
// TODO Replace "[key: string]: any" with actual defenition
export type I3STileContent = {
  attributes: I3SMeshAttributes;
  indices: TypedArray | null;
  featureIds: number[] | TypedArray;
  vertexCount: number;
  modelMatrix: Matrix4;
  coordinateSystem: number;
  byteLength: number;
  texture: TileContentTexture;
  [key: string]: any;
};

export type TileContentTexture =
  | ArrayBuffer
  | {
      compressed: boolean;
      mipmaps: boolean;
      width: number;
      height: number;
      data: TextureLevel[];
    }
  | null;

export type BoundingVolumes = {
  mbs: Mbs;
  obb: Obb;
};

export type Obb = {
  center: number[] | Vector3;
  halfSize: number[] | Vector3;
  quaternion: Quaternion;
};

export type Mbs = [number, number, number, number];

/** SceneLayer3D based on I3S specification - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/3DSceneLayer.cmn.md */
export type SceneLayer3D = {
  /** Unique numeric ID of the layer. */
  id: number;
  /** The relative URL to the 3DSceneLayerResource. Only present as part of the SceneServiceInfo resource. */
  href?: string;
  /** The user-visible layer type */
  layerType: '3DObject' | 'IntegratedMesh';
  /** The spatialReference of the layer including the vertical coordinate reference system (CRS). Well Known Text (WKT) for CRS is included to support custom CRS. */
  spatialReference?: SpatialReference;
  /** Enables consuming clients to quickly determine whether this layer is compatible (with respect to its horizontal and vertical coordinate system) with existing content. */
  heightModelInfo?: HeightModelInfo;
  /** The ID of the last update session in which any resource belonging to this layer has been updated. */
  version: string;
  /** The name of this layer. */
  name?: string;
  /** The time of the last update. */
  serviceUpdateTimeStamp?: {lastUpdate: number};
  /** The display alias to be used for this layer. */
  alias?: string;
  /** Description string for this layer. */
  description?: string;
  /** Copyright and usage information for the data in this layer. */
  copyrightText?: string;
  /** Capabilities supported by this layer. */
  capabilities: string[];
  /** ZFactor to define conversion factor for elevation unit. */
  ZFactor?: number;
  /** Indicates if any styling information represented as drawingInfo is captured as part of the binary mesh representation. */
  cachedDrawingInfo?: CachedDrawingInfo;
  /** An object containing drawing information. */
  drawingInfo?: DrawingInfo;
  /** An object containing elevation drawing information. If absent, any content of the scene layer is drawn at its z coordinate. */
  elevationInfo?: ElevationInfo;
  /** PopupInfo of the scene layer. */
  popupInfo?: PopupInfo;
  /** Indicates if client application will show the popup information. Default is FALSE. */
  disablePopup: boolean;
  /**
   * The store object describes the exact physical storage of a layer and
   * enables the client to detect when multiple layers are served from
   * the same store.
   */
  store: Store;
  /** A collection of objects that describe each attribute field regarding its field name, datatype, and a user friendly name {name,type,alias}. */
  fields?: Field[];
  /** Provides the schema and layout used for storing attribute content in binary format in I3S. */
  attributeStorageInfo?: AttributeStorageInfo[];
  /** Contains the statistical information for a layer. */
  statisticsInfo?: StatisticsInfo[];
  /** The paged-access index description. */
  nodePages?: NodePageDefinition;
  /** List of materials classes used in this layer. */
  materialDefinitions?: I3SMaterialDefinition[];
  /** Defines the set of textures that can be referenced by meshes. */
  textureSetDefinitions?: TextureSetDefinition[];
  /** Define the layouts of mesh geometry and its attributes */
  geometryDefinitions?: GeometryDefinition[];
  /** 3D extent. */
  fullExtent?: FullExtent;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/cachedDrawingInfo.cmn.md */
export type CachedDrawingInfo = {
  /** If true, the drawingInfo is captured as part of the binary scene layer representation. */
  color: boolean;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/drawingInfo.cmn.md */
export type DrawingInfo = {
  /** An object defining the symbology for the layer. See more information about supported renderer types in ArcGIS clients. */
  renderer: any;
  /** Scale symbols for the layer. */
  scaleSymbols: boolean;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/elevationInfo.cmn.md */
export type ElevationInfo = {
  mode: 'relativeToGround' | 'absoluteHeight' | 'onTheGround' | 'relativeToScene';
  /** Offset is always added to the result of the above logic except for onTheGround where offset is ignored. */
  offset: number;
  /** A string value indicating the unit for the values in elevationInfo */
  unit: string;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/statisticsInfo.cmn.md */
export type StatisticsInfo = {
  /** Key indicating the resource of the statistics. */
  key: string;
  /** Name of the field of the statistical information. */
  name: string;
  /** The URL to the statistics information. */
  href: string;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePageDefinition.cmn.md */
export type NodePageDefinition = {
  /** Number of nodes per page for this layer. Must be a power-of-two less than 4096 */
  nodesPerPage: number;
  /** Index of the root node. Default = 0. */
  rootIndex?: number;
  /** Defines the meaning of nodes[].lodThreshold for this layer. */
  lodSelectionMetricType: 'maxScreenThresholdSQ';
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/materialDefinitions.cmn.md */
export type I3SMaterialDefinition = {
  /** A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of pbrMetallicRoughness apply. */
  pbrMetallicRoughness: I3SPbrMetallicRoughness;
  /** The normal texture map. */
  normalTexture: I3SMaterialTexture;
  /** The occlusion texture map. */
  occlusionTexture: I3SMaterialTexture;
  /** The emissive texture map. */
  emissiveTexture: I3SMaterialTexture;
  /** The emissive color of the material. */
  emissiveFactor: [number, number, number];
  /** Defines the meaning of the alpha-channel/alpha-mask. */
  alphaMode: 'opaque' | 'mask' | 'blend';
  /** The alpha cutoff value of the material. */
  alphaCutoff: number;
  /** Specifies whether the material is double sided. */
  doubleSided: boolean;
  /** Winding order is counterclockwise. */
  cullFace: 'none' | 'front' | 'back';
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/pbrMetallicRoughness.cmn.md */
export type I3SPbrMetallicRoughness = {
  /** The material's base color factor. default=[1,1,1,1] */
  baseColorFactor: [number, number, number, number];
  /** The base color texture. */
  baseColorTexture: I3SMaterialTexture;
  /** the metalness of the material. default=1.0 */
  metallicFactor: number;
  /** the roughness of the material. default=1.0 */
  roughnessFactor: number;
  /** the metallic-roughness texture. */
  metallicRoughnessTexture: I3SMaterialTexture;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/materialTexture.cmn.md */
export type I3SMaterialTexture = {
  /** The index in layer.textureSetDefinitions. */
  textureSetDefinitionId: number;
  /** The set index of texture's TEXCOORD attribute used for texture coordinate mapping. Default is 0. Deprecated. */
  texCoord?: number;
  /** The normal texture: scalar multiplier applied to each normal vector of the normal texture. For occlusion texture,scalar multiplier controlling the amount of occlusion applied. Default=1 */
  factor?: number;
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/attributeStorageInfo.cmn.md */
export type AttributeStorageInfo = {
  key: string;
  name: string;
  header: {property: string; valueType: string}[];
  ordering?: string[];
  attributeValues?: AttributeValue;
  attributeByteCounts?: AttributeValue;
  objectIds?: AttributeValue;
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/field.cmn.md */
export type Field = {
  name: string;
  type: ESRIField;
  alias?: string;
  domain?: Domain;
};

export type ESRIField =
  | 'esriFieldTypeDate'
  | 'esriFieldTypeSingle'
  | 'esriFieldTypeDouble'
  | 'esriFieldTypeGUID'
  | 'esriFieldTypeGlobalID'
  | 'esriFieldTypeInteger'
  | 'esriFieldTypeOID'
  | 'esriFieldTypeSmallInteger'
  | 'esriFieldTypeString';

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/popupInfo.cmn.md */
export type PopupInfo = {
  title?: string;
  description?: string;
  expressionInfos?: any[];
  fieldInfos?: FieldInfo[];
  mediaInfos?: any[];
  popupElements?: {text?: string; type?: string; fieldInfos?: FieldInfo[]}[];
};

/**
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
 */
export type Node3DIndexDocument = {
  id: string;
  version?: string;
  path?: string;
  level?: number;
  mbs?: Mbs;
  obb?: Obb;
  lodSelection?: LodSelection[];
  children?: NodeReference[];
  neighbors?: NodeReference[];
  parentNode?: NodeReference;
  sharedResource?: Resource;
  featureData?: Resource[];
  geometryData?: Resource[];
  textureData?: Resource[];
  attributeData?: Resource[];
  created?: string;
  expires?: string;
};

/**
 * Minimal I3S node data is needed for loading
 */
export type I3SMinimalNodeData = {
  id: string;
  url?: string;
  transform?: number[];
  lodSelection?: LodSelection[];
  obb?: Obb;
  mbs?: Mbs;
  contentUrl?: string;
  textureUrl?: string;
  attributeUrls?: string[];
  materialDefinition?: I3SMaterialDefinition;
  textureFormat?: I3STextureFormat;
  textureLoaderOptions?: {[key: string]: any};
  children?: NodeReference[];
  isDracoGeometry: boolean;
};

export type LodSelection = {
  metricType?: string;
  maxError: number;
};

export type NodeReference = {
  id: string;
  version?: string;
  mbs?: Mbs;
  obb?: Obb;
  href?: string;
};

export type Resource = {
  href: string;
  layerContent?: string[];
  featureRange?: number[];
  multiTextureBundle?: string;
  vertexElements?: number[];
  faceElements?: number[];
  nodePath?: string;
};

export type MaxScreenThresholdSQ = {
  maxError: number;
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/node.cmn.md */
export type NodeInPage = {
  /**
   * The index in the node array. May be different than material, geometry and attribute resource id. See mesh for more information.
   */
  index: number;
  /**
   * The index of the parent node in the node array.
   */
  parentIndex?: number;
  /**
   * When to switch LoD. See https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePageDefinition.cmn.md for more information.
   */
  lodThreshold?: number;
  /**
   * Oriented bounding box for this node.
   */
  obb: Obb;
  /**
   * index of the children nodes indices.
   */
  children?: number[];
  /**
   * The mesh for this node. WARNING: only SINGLE mesh is supported at version 1.7 (i.e. length must be 0 or 1).
   */
  mesh?: NodeMesh;
};

export type SharedResources = {
  materialDefinitions?: GLTFMaterial[];
  textureDefinitions?: TextureDefinitionInfo[];
  nodePath: string;
};

type TextureImage = {
  id: string;
  size?: number;
  pixelInWorldUnits?: number;
  href?: string[];
  byteOffset?: string[];
  length?: number[];
  mimeType?: string;
  bufferView?: {
    data: ArrayBuffer;
  };
  image?: {
    height: number;
    width: number;
  };
};

export type Attribute = 'OBJECTID' | 'string' | 'double' | 'Int32' | string;

export type Extent = [number, number, number, number];

export type FeatureAttribute = {
  id: AttributeValue;
  faceRange: AttributeValue;
};

export type BuildingSceneLayerTileset = {
  header: BuildingSceneLayer;
  sublayers: BuildingSceneSublayer[];
};

export type BuildingSceneLayer = {
  id: number;
  name: string;
  version: string;
  alias?: string;
  layerType: 'Building';
  description?: string;
  copyrightText?: string;
  fullExtent: FullExtent;
  spatialReference: SpatialReference;
  heightModelInfo?: HeightModelInfo;
  sublayers: BuildingSceneSublayer[];
  filters?: Filter[];
  activeFilterID?: string;
  statisticsHRef?: string;
};

export type BuildingSceneSublayer = {
  id: number;
  name: string;
  alias?: string;
  discipline?: 'Mechanical' | 'Architectural' | 'Piping' | 'Electrical' | 'Structural';
  modelName?: string;
  layerType: 'group' | '3DObject' | 'Point';
  visibility?: boolean;
  sublayers?: BuildingSceneSublayer[];
  isEmpty?: boolean;
  url?: string;
};

type Filter = {
  id: string;
  name: string;
  description: string;
  isDefaultFilter?: boolean;
  isVisible?: boolean;
  filterBlocks: FilterBlock[];
  filterAuthoringInfo?: FilterAuthoringInfo;
};

type FilterAuthoringInfo = {
  type: string;
  filterBlocks: FilterBlockAuthoringInfo[];
};

type FilterBlockAuthoringInfo = {
  filterTypes: FilterType[];
};

type FilterType = {
  filterType: string;
  filterValues: string[];
};

type FilterBlock = {
  title: string;
  filterMode: FilterModeSolid | FilterModeWireFrame;
  filterExpression: string;
};

type Edges = {
  type: string;
  color: number[];
  size: number;
  transparency: number;
  extensionLength: number;
};

type FilterModeSolid = {
  type: 'solid';
};

type FilterModeWireFrame = {
  type: 'wireFrame';
  edges: Edges;
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/spatialReference.cmn.md */
export type SpatialReference = {
  /** The current WKID value of the vertical coordinate system. */
  latestVcsWkid: number;
  /** dentifies the current WKID value associated with the same spatial reference. */
  latestWkid: number;
  /** The WKID value of the vertical coordinate system. */
  vcsWkid: number;
  /** WKID, or Well-Known ID, of the CRS. Specify either WKID or WKT of the CRS. */
  wkid: number;
  /** WKT, or Well-Known Text, of the CRS. Specify either WKT or WKID of the CRS but not both. */
  wkt?: string;
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/fullExtent.cmn.md */
type FullExtent = {
  /** left */
  xmin: number;
  /** right */
  xmax: number;
  /** bottom */
  ymin: number;
  /** top */
  ymax: number;
  /** lowest elevation */
  zmin: number;
  /** highest elevation */
  zmax: number;
  spatialReference?: SpatialReference;
};

type TextureDefinitionInfo = {
  encoding: string[];
  wrap?: string[];
  atlas?: boolean;
  uvSet?: string;
  channels?: 'rbg' | 'rgba' | string;
  images: TextureImage[];
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/domain.cmn.md */
type Domain = {
  type: string;
  name: string;
  description?: string;
  fieldType?: string;
  range?: [number, number];
  codedValues?: {name: string; code: string | number}[];
  mergePolicy?: string;
  splitPolicy?: string;
};
/**
 * spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/store.cmn.md
 */
type Store = {
  id: string | number;
  profile: string;
  version: number | string;
  resourcePattern: string[];
  rootNode: string;
  extent: number[];
  indexCRS: string;
  vertexCRS: string;
  normalReferenceFrame: string;
  attributeEncoding: string;
  textureEncoding: string[];
  lodType: string;
  lodModel: string;
  defaultGeometrySchema: DefaultGeometrySchema;
};
/**
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/defaultGeometrySchema.cmn.md
 */
type DefaultGeometrySchema = {
  geometryType?: 'triangles';
  topology: 'PerAttributeArray' | 'Indexed';
  header: HeaderAttribute[];
  ordering: string[];
  vertexAttributes: VertexAttribute;
  faces?: VertexAttribute;
  featureAttributeOrder: string[];
  featureAttributes: FeatureAttribute;
  // TODO Do we realy need this Property?
  attributesOrder?: string[];
};
/**
 * spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/headerAttribute.cmn.md
 */
export type HeaderAttribute = {
  property: HeaderAttributeProperty.vertexCount | HeaderAttributeProperty.featureCount | string;
  type:
    | DATA_TYPE.UInt8
    | DATA_TYPE.UInt16
    | DATA_TYPE.UInt32
    | DATA_TYPE.UInt64
    | DATA_TYPE.Int16
    | DATA_TYPE.Int32
    | DATA_TYPE.Int64
    | DATA_TYPE.Float32
    | DATA_TYPE.Float64;
};
export enum HeaderAttributeProperty {
  vertexCount = 'vertexCount',
  featureCount = 'featureCount'
}
export type VertexAttribute = {
  position: GeometryAttribute;
  normal: GeometryAttribute;
  uv0: GeometryAttribute;
  color: GeometryAttribute;
  region?: GeometryAttribute;
};
export type GeometryAttribute = {
  byteOffset?: number;
  valueType:
    | DATA_TYPE.UInt8
    | DATA_TYPE.UInt16
    | DATA_TYPE.Int16
    | DATA_TYPE.Int32
    | DATA_TYPE.Int64
    | DATA_TYPE.Float32
    | DATA_TYPE.Float64;
  valuesPerElement: number;
};
export type I3SMeshAttributes = {
  [key: string]: I3SMeshAttribute;
};
export interface I3SMeshAttribute extends MeshAttribute {
  type?: number;
  metadata?: any;
}
/** https://github.com/Esri/i3s-spec/blob/master/docs/1.8/heightModelInfo.cmn.md */
type HeightModelInfo = {
  heightModel: 'gravity_related_height' | 'ellipsoidal';
  vertCRS: string;
  heightUnit:
    | 'meter'
    | 'us-foot'
    | 'foot'
    | 'clarke-foot'
    | 'clarke-yard'
    | 'clarke-link'
    | 'sears-yard'
    | 'sears-foot'
    | 'sears-chain'
    | 'benoit-1895-b-chain'
    | 'indian-yard'
    | 'indian-1937-yard'
    | 'gold-coast-foot'
    | 'sears-1922-truncated-chain'
    | 'us-inch'
    | 'us-mile'
    | 'us-yard'
    | 'millimeter'
    | 'decimeter'
    | 'centimeter'
    | 'kilometer';
};

export type TextureSetDefinitionFormats = {name: string; format: I3STextureFormat}[];

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/textureSetDefinition.cmn.md */
type TextureSetDefinition = {
  formats: TextureSetDefinitionFormats;
  atlas?: boolean;
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/geometryDefinition.cmn.md */
type GeometryDefinition = {
  topology: 'triangle' | string;
  geometryBuffers: GeometryBuffer[];
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/geometryBuffer.cmn.md */
type GeometryBuffer = {
  offset?: number;
  position?: GeometryBufferItem;
  normal?: GeometryBufferItem;
  uv0?: GeometryBufferItem;
  color?: GeometryBufferItem;
  uvRegion?: GeometryBufferItem;
  featureId?: GeometryBufferItem;
  faceRange?: GeometryBufferItem;
  compressedAttributes?: {encoding: string; attributes: string[]};
};

type GeometryBufferItem = {type: string; component: number; encoding?: string; binding: string};

type AttributeValue = {valueType: string; encoding?: string; valuesPerElement?: number};

export type FieldInfo = {
  fieldName: string;
  visible: boolean;
  isEditable: boolean;
  label: string;
};
