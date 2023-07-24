import type {Matrix4, Quaternion, Vector3} from '@math.gl/core';
import type {TypedArray, MeshAttribute, TextureLevel} from '@loaders.gl/schema';
import {Tile3D, Tileset3D} from '@loaders.gl/tiles';

export type COLOR = [number, number, number, number];

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

export type I3SParseOptions = {
  /** ArcGIS access token */
  token?: string;
  /** Is 3DSceneLayer json expected in response */
  isTileset?: string;
  /** Is 3DNodeIndexDocument json expected in response */
  isTileHeader?: string;
  /** Tile3D instance. This property used only to load tile content */
  /** Tile-specific options */
  _tileOptions?: I3STileOptions;
  /** Tileset-specific options */
  _tilesetOptions?: I3STilesetOptions;
  /** Load Draco Compressed geometry if available */
  useDracoGeometry?: boolean;
  /** Load compressed textures if available */
  useCompressedTextures?: boolean;
  /** Set false if don't need to parse textures */
  decodeTextures?: boolean;
  /** deck.gl compatible coordinate system.
   * https://github.com/visgl/deck.gl/blob/master/docs/developer-guide/coordinate-systems.md
   * Supported coordinate systems: METER_OFFSETS, LNGLAT_OFFSETS
   */
  coordinateSystem?: number;
  colorsByAttribute?: {
    attributeName: string;
    minValue: number;
    maxValue: number;
    minColor: COLOR;
    maxColor: COLOR;
    mode: string;
  };

  /** @deprecated */
  tile?: Tile3D | I3STileOptions;
  /** Tileset3D instance. This property used only to load tile content */
  /** @deprecated */
  tileset?: Tileset3D | I3STilesetOptions;
};

export type I3STileOptions = {
  isDracoGeometry: boolean;
  textureUrl?: string;
  textureFormat?: I3STextureFormat;
  textureLoaderOptions?: any;
  materialDefinition?: I3SMaterialDefinition;
  attributeUrls: string[];
  mbs: Mbs;
};

export type I3STilesetOptions = {
  store: Store;
  attributeStorageInfo: AttributeStorageInfo[];
  fields: Field[];
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
  quaternion: number[] | Quaternion;
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
  normalTexture?: I3SMaterialTexture;
  /** The occlusion texture map. */
  occlusionTexture?: I3SMaterialTexture;
  /** The emissive texture map. */
  emissiveTexture?: I3SMaterialTexture;
  /** The emissive color of the material. */
  emissiveFactor?: [number, number, number];
  /** Defines the meaning of the alpha-channel/alpha-mask. */
  alphaMode: 'opaque' | 'mask' | 'blend';
  /** The alpha cutoff value of the material. */
  alphaCutoff?: number;
  /** Specifies whether the material is double sided. */
  doubleSided?: boolean;
  /** Winding order is counterclockwise. */
  cullFace?: 'none' | 'front' | 'back';
};
/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/pbrMetallicRoughness.cmn.md */
export type I3SPbrMetallicRoughness = {
  /** The material's base color factor. default=[1,1,1,1] */
  baseColorFactor?: [number, number, number, number];
  /** The base color texture. */
  baseColorTexture?: I3SMaterialTexture;
  /** the metalness of the material. default=1.0 */
  metallicFactor: number;
  /** the roughness of the material. default=1.0 */
  roughnessFactor: number;
  /** the metallic-roughness texture. */
  metallicRoughnessTexture?: I3SMaterialTexture;
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

/**
 * https://github.com/Esri/i3s-spec/blob/master/docs/1.8/materialDefinitionInfo.cmn.md
 */
export type MaterialDefinitionInfo = {
  /** A name for the material as assigned in the creating application. */
  name?: string;
  /** Indicates the material type, chosen from the supported values. */
  type?: 'standard' | 'water' | 'billboard' | 'leafcard' | 'reference';
  /** The href that resolves to the shared resource bundle in which the material definition is contained. */
  $ref?: string;
  /** Parameter defined for the material.
   * https://github.com/Esri/i3s-spec/blob/master/docs/1.8/materialParams.cmn.md
   */
  params: {
    /** Indicates transparency of this material; 0 = opaque, 1 = fully transparent. */
    transparency?: number;
    /** Indicates reflectivity of this material. */
    reflectivity?: number;
    /** Indicates shininess of this material. */
    shininess?: number;
    /** Ambient color of this material. Ambient color is the color of an object where it is in shadow.
     * This color is what the object reflects when illuminated by ambient light rather than direct light. */
    ambient?: number[];
    /** Diffuse color of this material. Diffuse color is the most instinctive meaning of the color of an object.
     * It is that essential color that the object reveals under pure white light. It is perceived as the color
     * of the object itself rather than a reflection of the light. */
    diffuse?: number[];
    /** Specular color of this material. Specular color is the color of the light of a specular reflection
     * (specular reflection is the type of reflection that is characteristic of light reflected from a shiny
     * surface). */
    specular?: number[];
    /** Rendering mode. */
    renderMode: 'textured' | 'solid' | 'untextured' | 'wireframe';
    /** TRUE if features with this material should cast shadows. */
    castShadows?: boolean;
    /** TRUE if features with this material should receive shadows */
    receiveShadows?: boolean;
    /** Indicates the material culling options {back, front, none}. */
    cullFace?: string;
    /** This flag indicates that the vertex color attribute of the geometry should be used to color the geometry
     * for rendering. If texture is present, the vertex colors are multiplied by this color.
     * e.g. pixel_color = [interpolated]vertex_color * texel_color. Default is false. */
    vertexColors?: boolean;
    /** This flag indicates that the geometry has uv region vertex attributes. These are used for adressing
     * subtextures in a texture atlas. The uv coordinates are relative to this subtexture in this case.
     * This is mostly useful for repeated textures in a texture atlas. Default is false. */
    vertexRegions?: boolean;
    /** Indicates whether Vertex Colors also contain a transparency channel. Default is false. */
    useVertexColorAlpha?: boolean;
  };
};

/** https://github.com/Esri/i3s-spec/blob/master/docs/1.8/sharedResource.cmn.md */
export type SharedResources = {
  /** Materials describe how a Feature or a set of Features is to be rendered. */
  materialDefinitions?: {[key: string]: MaterialDefinitionInfo};
  /** A Texture is a set of images, with some parameters specific to the texture/uv mapping to geometries. */
  textureDefinitions?: {[key: string]: TextureDefinitionInfo};
};

/** https://github.com/Esri/i3s-spec/blob/master/docs/1.8/image.cmn.md */
type TextureImage = {
  /** A unique ID for each image. Generated using the BuildID function. */
  id: string;
  /** width of this image, in pixels. */
  size?: number;
  /** The maximum size of a single pixel in world units.
   * This property is used by the client to pick the image to load and render. */
  pixelInWorldUnits?: number;
  /** The href to the image(s), one per encoding, in the same order as the encodings. */
  href?: string[];
  /** The byte offset of this image's encodings. There is one per encoding,
   * in the same order as the encodings, in the block in which this texture image resides. */
  byteOffset?: string[];
  /** The length in bytes of this image's encodings. There is one per encoding,
   * in the same order as the encodings. */
  length?: number[];
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
export type FullExtent = {
  /** left longitude in decimal degrees */
  xmin: number;
  /** right longitude in decimal degrees */
  xmax: number;
  /** bottom latitude in decimal degrees*/
  ymin: number;
  /** top latitude in decimal degrees*/
  ymax: number;
  /** lowest elevation in meters */
  zmin: number;
  /** highest elevation in meters */
  zmax: number;
  spatialReference?: SpatialReference;
};

/**
 * https://github.com/Esri/i3s-spec/blob/master/docs/1.8/textureDefinitionInfo.cmn.md
 */
export type TextureDefinitionInfo = {
  /** MIMEtype - The encoding/content type that is used by all images in this map */
  encoding?: string[];
  /** UV wrapping modes, from {none, repeat, mirror}. */
  wrap?: string[];
  /** TRUE if the Map represents a texture atlas. */
  atlas?: boolean;
  /** The name of the UV set to be used as texture coordinates. */
  uvSet?: string;
  /** Indicates channels description. */
  channels?: 'rbg' | 'rgba' | string;
  /** An image is a binary resource, containing a single raster that can be used to texture a feature or symbol. */
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
  id?: string | number;
  profile: string;
  version: number | string;
  resourcePattern?: string[];
  rootNode?: string;
  extent?: number[];
  indexCRS?: string;
  vertexCRS?: string;
  normalReferenceFrame?: string;
  lodType?: string;
  lodModel?: string;
  defaultGeometrySchema: DefaultGeometrySchema;
  nidEncoding?: string;
  textureEncoding?: string[];
  featureEncoding?: string;
  geometryEncoding?: string;
  attributeEncoding?: string;
  indexingScheme?: string;
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
    | 'UInt8'
    | 'UInt16'
    | 'UInt32'
    | 'UInt64'
    | 'Int16'
    | 'Int32'
    | 'Int64'
    | 'Float32'
    | 'Float64';
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
  valueType: 'UInt8' | 'UInt16' | 'Int16' | 'Int32' | 'Int64' | 'Float32' | 'Float64';
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

export type ArcGisWebSceneData = {
  header: ArcGisWebScene;
  layers: OperationalLayer[];
  unsupportedLayers: OperationalLayer[];
};

/**
 * ArcGis WebScene spec - https://developers.arcgis.com/web-scene-specification/objects/webscene/
 */
export type ArcGisWebScene = {
  /**
   * @todo add type.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/applicationProperties/
   * Configuration of application and UI elements.
   */
  applicationProperties?: any;
  /**
   * Operational layers contain business data which are used to make thematic scenes.
   */
  operationalLayers: OperationalLayer[];
  /**
   * Basemaps give the web scene a geographic context.
   */
  baseMap: BaseMap;
  /**
   * Ground defines the main surface of the web scene, based on elevation layers.
   */
  ground: Ground;
  /**
   * An object that defines the characteristics of the vertical coordinate system used by the web scene.
   */
  heightModelInfo: HeightModelInfo;
  /**
   * Root element in the web scene specifying a string value indicating the web scene version.
   * Valid values: 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.20, 1.21, 1.22, 1.23, 1.24, 1.25, 1.26, 1.27
   */
  version: string;
  /**
   * String value indicating the application which authored the webmap
   */
  authoringApp: string;
  /**
   * String value indicating the authoring App's version number.
   */
  authoringAppVersion: string;
  /**
   * A presentation consists of multiple slides, where each slide is a specific view into the web scene.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/presentation/
   * @todo Add presentation type.
   */
  presentation: ArcGisPresentation;
  /**
   * An object that provides information about the initial environment settings and viewpoint of the web scene.
   */
  initialState: InitialState;
  /**
   * An object used to specify the spatial reference of the given geometry.
   */
  spatialReference: SpatialReference;
  viewingMode: 'global' | 'local';
  /**
   * @todo add type.
   * Defines area to be clipped for display.
   */
  clippingArea?: any;
  /**
   * @todo add type.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/mapFloorInfo/
   * Contains floor-awareness information for the web scene.
   */
  mapFloorInfo?: any;
  /**
   * @todo add type.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/mapRangeInfo/
   * Map Range Information
   */
  mapRangeInfo?: any;
  /**
   * @todo add type.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/table/
   * An array of table objects.
   */
  tables?: any;
  /**
   * @todo add type.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/transportationNetwork/
   * Used to specify the transportation networks of the scene.
   */
  transportationNetworks?: any;
  /**
   * @todo add type.
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/widgets/
   * The widgets object contains widgets that should be exposed to the user.
   */
  widgets?: any;
};

/**
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-webscene-Presentation.html
 */
type ArcGisPresentation = {
  slides: Slide[];
};

/**
 * A slide stores a snapshot of several pre-set properties of the WebScene and SceneView,
 * such as the basemap, viewpoint and visible layers.
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-webscene-Slide.html
 */
type Slide = {
  id: string;
  title: {
    text: string;
  };
  thumbnail: {
    url: string;
  };
  description: {
    text: string;
  };
  ground: {
    transparency: number;
  };
  baseMap: ArcGisBaseMap;
  visibleLayers: ArcGisVisibleLayer[];
  viewpoint: ArcGisViewPoint;
};

/**
 * The basemap of the scene. Only the base and reference layers of the basemap are stored in a slide.
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-Basemap.html
 */
type ArcGisBaseMap = {
  id: string;
  title: string;
  baseMapLayers: ArcGisBaseMapLayer[];
};

/**
 * The visible layers of the scene.
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-webscene-Slide.html#visibleLayers
 */
type ArcGisVisibleLayer = {
  id: string;
  sublayerIds: number[];
};
/**
 * The basemap of the scene.
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-Basemap.html
 */
type ArcGisBaseMapLayer = {
  id: string;
  title: string;
  url: string;
  layerType: string;
  visibility: boolean;
};

/**
 * The viewpoint of the slide. This acts like a bookmark, saving a predefined location or point of view from which to view the scene.
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-Viewpoint.html
 */
type ArcGisViewPoint = {
  scale: number;
  rotation?: number;
  /**
   * Spec - https://developers.arcgis.com/web-scene-specification/objects/viewpoint/
   */
  targetGeometry: any;
  camera: ArcGisCamera;
};

/**
 * The camera defines the position, tilt, and heading of the point from which the SceneView's visible extent is observed.
 * It is not associated with device hardware. This class only applies to 3D SceneViews.
 * Spec - https://developers.arcgis.com/javascript/latest/api-reference/esri-Camera.html
 */
export type ArcGisCamera = {
  position: {
    x: number;
    y: number;
    z: number;
  };
  spatialReference: {
    wkid: number;
    latestWkid: number;
  };
  heading: number;
  tilt: number;
};

/**
 * Operational layers contain your data. Usually, a basemap sits beneath your operational layers to give them geographic context.
 * Spec- https://developers.arcgis.com/web-scene-specification/objects/operationalLayers/
 */
export type OperationalLayer = {
  id: string;
  opacity: number;
  title: string;
  url: string;
  visibility: boolean;
  itemId: string;
  layerType: string;
  LayerDefinition: LayerDefinition;
  screenSizePerspective: boolean;
  showLabels?: boolean;
  disablePopup?: boolean;
  showLegend?: boolean;
  layers?: OperationalLayer[];
};

type LayerDefinition = {
  elevationInfo: ElevationInfo;
  drawingInfo: DrawingInfo;
};

type BaseMap = {
  id: string;
  title: string;
  baseMapLayers: BaseMapLayer[];
  elevationLayers: ElevationLayer[];
};

type BaseMapLayer = {
  id: string;
  opacity: number;
  title: string;
  url: string;
  visibility: boolean;
  layerType: string;
};

type ElevationLayer = {
  id: string;
  listMode: string;
  title: string;
  url: string;
  visibility: boolean;
  layerType: string;
};

type Ground = {
  layers: ElevationLayer[];
  transparency: number;
  navigationConstraint: NavigationConstraint;
};

type NavigationConstraint = {
  type: string;
};

type InitialState = {
  environment: Enviroment;
  viewpoint: ViewPoint;
};

type Enviroment = {
  lighting: Lighting;
  atmosphereEnabled?: string;
  starsEnabled?: string;
};

type Lighting = {
  datetime?: number;
  displayUTCOffset?: number;
};

type ViewPoint = {
  camera: Camera;
};

type Camera = {
  position: CameraPosition;
  heading: number;
  tilt: number;
};

type CameraPosition = {
  spatialReference: SpatialReference;
  x: number;
  y: number;
  z: number;
};

/**
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/statsInfo.cmn.md
 */
export type StatsInfo = {
  /** Represents the count of the value. */
  totalValuesCount?: number;
  /** Minimum attribute value for the entire layer. */
  min?: number;
  /** Maximum attribute value for the entire layer. */
  max?: number;
  /** Count for the entire layer. */
  count?: number;
  /** Sum of the attribute values over the entire layer. */
  sum?: number;
  /** Representing average or mean value. For example, sum/count. */
  avg?: number;
  /** Representing the standard deviation. */
  stddev?: number;
  /**	Representing variance. For example, stats.stddev *stats.stddev. */
  variance?: number;
  /** Represents the histogram. */
  histogram?: Histogram;
  /** An array of most frequently used values within the point cloud scene layer. */
  mostFrequentValues?: ValueCount[];
};

/** Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/histogram.cmn.md */
export type Histogram = {
  /** Minimum attribute value for the entire layer. */
  minimum: number;
  /** Maximum attribute value for the entire layer. Maximum array size for stats.histo.counts is 256. */
  maximum: number;
  /** Count for the entire layer. */
  counts: number[];
};

export type ValueCount = {
  /** Type of the attribute values after decompression, if applicable. Please note that string is not supported for point cloud scene layer attributes. */
  value: number | string;
  /** Count of the number of values. May exceed 32 bits. */
  count: number;
};
