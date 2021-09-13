import type {GLTFMaterial} from '@loaders.gl/gltf';
import type {Quaternion, Vector3} from '@math.gl/core';
import type {Mesh} from '@loaders.gl/gltf';

export type Tileset = {[key: string]: any};
export type NodePage = {[key: string]: any};
export type Tile = {[key: string]: any};

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

// SceneLayer3D based on I3S specification https://github.com/Esri/i3s-spec/tree/master/docs/1.7
// TODO Add description for each property

export type SceneLayer3D = {
  id: number;
  href?: string;
  layerType: string;
  spatialReference?: SpatialReference;
  heightModelInfo?: HeightModelInfo;
  version: string;
  name?: string;
  capabilities: string[];
  store: Store;
  nodePages?: NodePages;
  materialDefinitions?: GLTFMaterial[];
  textureSetDefinitions?: TextureSetDefinition[];
  geometryDefinitions?: GeometryDefinitions;
  attributeStorageInfo?: AttributeStorageInfo[];
  fields?: Field[];
  popupInfo?: PopupInfo;
};

export type AttributeStorageInfo = {
  key: string;
  name: string;
  header: {property: string; valueType: string}[];
  ordering?: string[];
  attributeValues?: AttributeValue;
  attributeByteCounts?: AttributeValue;
  objectIds?: AttributeValue;
};

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

export type PopupInfo = {
  title?: string;
  description?: string;
  expressionInfos?: any[];
  fieldInfos?: FieldInfo[];
  mediaInfos?: any[];
  popupElements?: {text?: string; type?: string; fieldInfos?: FieldInfo[]}[];
};

// Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
export type Node3DIndexDocument = {
  id: string;
  version?: string;
  path?: string;
  level?: number;
  mbs?: Mbs;
  obb?: Obb;
  lodSelection?: LodSelection;
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

export type I3SGeometry = {
  geometry: ArrayBuffer | null;
  compressedGeometry?: ArrayBuffer | null;
  texture: any | null;
  sharedResources: SharedResources | null;
  meshMaterial?: GLTFMaterial | null;
  vertexCount: number | null;
  attributes: any | null;
  featureCount: number | null;
  geometryBuffer?: ArrayBuffer;
};

export type MaxScreenThresholdSQ = {
  maxError: number;
};

export type NodeInPage = {
  index?: number;
  lodThreshold: number;
  obb: Obb;
  children: any[];
  mesh: Mesh;
};

export type SharedResources = {
  materialDefinitions?: GLTFMaterial[];
  textureDefinitions?: TextureDefinitionInfo[];
  nodePath: string;
};

export type TextureImage = {
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

export type FeatureAttribute = {[key: string]: any};

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

type SpatialReference = {
  wkid: number;
  latestWkid: number;
  vcsWkid: number;
  latestVcsWkid: number;
  wkt?: string;
};

type FullExtent = {
  xmin: number; // left
  xmax: number; // right
  ymin: number; // bottom
  ymax: number; // top
  zmin: number; // lowest elevation
  zmax: number; // highest elevation
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

type DefaultGeometrySchema = {
  vartexCount: number;
  featureCount: number;
  position: Float32Array;
  normal: Float32Array;
  uv0: Float32Array;
  color: Uint8Array;
  id: Float32Array;
  faceRange: Uint32Array;
  region: Uint16Array;
};

// TODO change string to possible values from https://github.com/Esri/i3s-spec/blob/master/docs/1.8/heightModelInfo.cmn.md
type HeightModelInfo = {
  heightModel: string;
  vertCRS: string;
  heightUnit: string;
};

type NodePages = {
  nodesPerPage: number;
  lodSelectionMetricType: string;
};

type TextureSetDefinition = {
  formats: {name: string; format: string}[];
  atlas?: boolean;
};

type GeometryDefinitions = {
  topology: 'triangle' | string;
  geometryBuffers: GeometryBuffer[];
};

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

type FieldInfo = {
  fieldName: string;
  visible: boolean;
  isEditable: boolean;
  label: string;
};
