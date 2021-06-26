import type {GLTFMaterial} from '@loaders.gl/gltf';

// Types are based on I3S specification https://github.com/Esri/i3s-spec/tree/master/docs/1.7
// TODO Add description for each property

export type SceneLayer3D = {
  id: number;
  href?: string;
  layerType: string;
  spatialReference?: {
    wkid: number;
    latestWkid: number;
    vcsWkid: number;
    latestVcsWkid: number;
  };
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

type AttributeStorageInfo = {
  key: string;
  name: string;
  header: {property: string; valueType: string}[];
  ordering?: string[];
  attributeValues?: AttributeValue;
  attributeByteCounts?: AttributeValue;
  objectIds?: AttributeValue;
};

type AttributeValue = {valueType: string; encoding?: string; valuesPerElement?: number};

type Field = {
  name: string;
  type: string;
  alias?: string;
  domain?: Domain;
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

export type PopupInfo = {
  title?: string;
  description?: string;
  expressionInfos?: any[];
  fieldInfos?: FieldInfo[];
  mediaInfos?: any[];
  popupElements?: {text?: string; type?: string; fieldInfos?: FieldInfo[]}[];
};

type FieldInfo = {
  fieldName: string;
  visible: boolean;
  isEditable: boolean;
  label: string;
};
