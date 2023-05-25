import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {LoaderWithParser} from '@loaders.gl/loader-utils';
import {Matrix4, Vector3} from '@math.gl/core';
import {TILESET_TYPE, LOD_METRIC_TYPE, TILE_TYPE, TILE_REFINEMENT} from '@loaders.gl/tiles';

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

/**
 * A 3D Tiles tileset JSON
 * https://github.com/CesiumGS/3d-tiles/tree/main/specification#property-reference
 */
export type Tiles3DTilesetJSON = {
  /** Metadata about the entire tileset.
   * https://github.com/CesiumGS/3d-tiles/tree/main/specification#asset
   */
  asset: {
    /** The 3D Tiles version. The version defines the JSON schema for the tileset JSON and the base set of tile formats. */
    version: string;
    /** Application-specific version of this tileset, e.g., for when an existing tileset is updated. */
    tilesetVersion?: string;
    /** Dictionary object with extension-specific objects. */
    extensions?: object;
    /** Application-specific data. */
    extras?: any;
  };
  /** A dictionary object of metadata about per-feature properties. */
  properties?: Record<string, TilesetProperty>;
  /** The error, in meters, introduced if this tileset is not rendered. At runtime, the geometric error is used to compute screen space error (SSE), i.e., the error measured in pixels. */
  geometricError: number;
  /** A tile in a 3D Tiles tileset. */
  root: Tiles3DTileJSON;
  /** Names of 3D Tiles extensions used somewhere in this tileset. */
  extensionsUsed?: string[];
  /** Names of 3D Tiles extensions required to properly load this tileset. */
  extensionsRequired?: string[];
  /** Dictionary object with extension-specific objects. */
  extensions?: object;
  /** Application-specific data. */
  extras?: any;
};

/** TilesetJSON postprocessed by Tiles3DLoader */
export type Tiles3DTilesetJSONPostprocessed = Omit<Tiles3DTilesetJSON, 'root'> & {
  /**
   * Loader used
   * @deprecated
   */
  loader: LoaderWithParser;
  /** URL used to load a tileset resource */
  url: string;
  /** HTTP request query string */
  queryString: string;
  /** base path that non-absolute paths in tileset are relative to. */
  basePath: string;
  /** tileset type */
  type: TILESET_TYPE.TILES3D;
  /** LOD metric type */
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  /** LOD metric value */
  lodMetricValue: number;
  /** Postprocessed root */
  root: Tiles3DTileJSONPostprocessed;
};

/**
 * A tile in a 3D Tiles tileset.
 * https://github.com/CesiumGS/3d-tiles/tree/main/specification#tile
 */
export type Tiles3DTileJSON = {
  /** A bounding volume that encloses a tile or its content. */
  boundingVolume: BoundingVolume;
  /** A bounding volume that encloses a tile or its content. */
  viewerRequestVolume?: object;
  /** The error, in meters, introduced if this tile is rendered and its children are not. At runtime, the geometric error is used to compute screen space error (SSE), i.e., the error measured in pixels. */
  geometricError: number;
  /**
   * Specifies if additive or replacement refinement is used when traversing the tileset for rendering. This property is required for the root tile of a tileset; it is optional for all other tiles.
   * The default is to inherit from the parent tile.
   */
  refine?: string;
  /** A floating-point 4x4 affine transformation matrix, stored in column-major order, that transforms the tile's content */
  transform?: number[];
  /** Metadata about the tile's content and a link to the content. */
  content?: Tiles3DTileContentJSON;
  /** An array of objects that define child tiles. */
  children: Tiles3DTileJSON[];
  /** Dictionary object with extension-specific objects. */
  extensions?: object;
  /** Application-specific data. */
  extras?: any;

  /** 3DTiles v1.1 properties
   * https://github.com/CesiumGS/3d-tiles/blob/draft-1.1/specification/schema/tile.schema.json
   */
  /** This object allows a tile to be implicitly subdivided. Tile and content availability and metadata is stored in subtrees which are referenced externally. */
  implicitTiling?: ImplicitTilingData;
};

export type Tiles3DTileJSONPostprocessed = Omit<Tiles3DTileJSON, 'refine'> & {
  /** Unique ID */
  id?: string;
  /** Content full URL */
  contentUrl?: string;
  /** LOD metric type */
  lodMetricType?: LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  /** LOD metric value */
  lodMetricValue?: number;
  /** Duplicate of transform */
  transformMatrix?: number[];
  /** Type of tile */
  type?: TILE_TYPE | string;
  /**
   * Specifies if additive or replacement refinement is used when traversing the tileset for rendering. This property is required for the root tile of a tileset; it is optional for all other tiles.
   * The default is to inherit from the parent tile.
   */
  refine?: TILE_REFINEMENT | string;
};

/** Metadata about the tile's content and a link to the content. */
export type Tiles3DTileContentJSON = {
  /** A uri that points to the tile's content. When the uri is relative, it is relative to the referring tileset JSON file. */
  uri: string;
  /** url doesn't allign the spec but we support it same way as uri */
  url?: string;
  /** A bounding volume that encloses a tile or its content. At least one bounding volume property is required. Bounding volumes include box, region, or sphere. */
  boundingVolume?: BoundingVolume;
  /** Dictionary object with extension-specific objects. */
  extensions?: object;
  /** Application-specific data. */
  extras?: any;
};

/** A bounding volume that encloses a tile or its content.
 * https://github.com/CesiumGS/3d-tiles/tree/main/specification#bounding-volume
 */
export type BoundingVolume = {
  /** An array of 12 numbers that define an oriented bounding box. The first three elements define the x, y, and z values for the center of the box.
   * The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length. The next three elements (indices 6, 7, and 8) define
   * the y axis direction and half-length. The last three elements (indices 9, 10, and 11) define the z axis direction and half-length. */
  box?: number[];
  /** An array of four numbers that define a bounding sphere. The first three elements define the x, y, and z values for the center of the sphere.
   * The last element (with index 3) defines the radius in meters. */
  sphere?: number[];
  /** An array of six numbers that define a bounding geographic region in EPSG:4979 coordinates with the order [west, south, east, north, minimum height, maximum height].
   * Longitudes and latitudes are in radians, and heights are in meters above (or below) the WGS84 ellipsoid. */
  region?: number[];
  /** Dictionary object with extension-specific objects. */
  extensions?: object;
  /** Application-specific data. */
  extras?: any;
};

/**
 * A dictionary object of metadata about per-feature properties.
 * https://github.com/CesiumGS/3d-tiles/tree/main/specification#properties
 */
export type TilesetProperty = {
  /** The maximum value of this property of all the features in the tileset. */
  maximum: number;
  /** The minimum value of this property of all the features in the tileset. */
  minimum: number;
  /** Dictionary object with extension-specific objects. */
  extensions?: object;
  /** Application-specific data. */
  extras?: any;
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
export type ImplicitTilingExensionData = ImplicitTilingData & {
  maximumLevel?: number;
};

/** 3DTiles v1.1 types */

/**
 * This object allows a tile to be implicitly subdivided. Tile and content availability and metadata is stored in subtrees which are referenced externally.
 * https://github.com/CesiumGS/3d-tiles/blob/draft-1.1/specification/schema/tile.implicitTiling.schema.json
 * */
type ImplicitTilingData = {
  /** A string describing the subdivision scheme used within the tileset. */
  subdivisionScheme: 'QUADTREE' | 'OCTREE' | string;
  /** The number of distinct levels in each subtree. For example, a quadtree with `subtreeLevels = 2` will have subtrees with 5 nodes (one root and 4 children). */
  subtreeLevels: number;
  /** The numbers of the levels in the tree with available tiles. */
  availableLevels: number;
  /** An object describing the location of subtree files. */
  subtrees: {
    /** A template URI pointing to subtree files. A subtree is a fixed-depth (defined by `subtreeLevels`) portion of the tree to keep memory use bounded.
     * The URI of each file is substituted with the subtree root's global level, x, and y. For subdivision scheme `OCTREE`, z shall also be given. Relative paths are relative to the tileset JSON. */
    uri: string;
  };
};
