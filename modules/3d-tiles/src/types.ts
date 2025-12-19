// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GLTFPostprocessed, FeatureTableJson} from '@loaders.gl/gltf';
export type {FeatureTableJson};

import {LoaderWithParser} from '@loaders.gl/loader-utils';
import {Matrix4, Vector3} from '@math.gl/core';
import {TILESET_TYPE, LOD_METRIC_TYPE, TILE_TYPE, TILE_REFINEMENT} from '@loaders.gl/tiles';

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
  shape: 'tileset3d';
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
    /** Not mentioned in 1.0 spec but some tilesets contain this option */
    gltfUpAxis?: string;
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
  /** @deprecated Loader used */
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
  boundingVolume: Tile3DBoundingVolume;
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

export type Tiles3DTileJSONPostprocessed = Omit<Tiles3DTileJSON, 'refine' | 'children'> & {
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
  /** An array of objects that define child tiles. */
  children: Tiles3DTileJSONPostprocessed[];
};

/** Metadata about the tile's content and a link to the content. */
export type Tiles3DTileContentJSON = {
  /** A uri that points to the tile's content. When the uri is relative, it is relative to the referring tileset JSON file. */
  uri: string;
  /** url doesn't allign the spec but we support it same way as uri */
  url?: string;
  /** A bounding volume that encloses a tile or its content. At least one bounding volume property is required. Bounding volumes include box, region, or sphere. */
  boundingVolume?: Tile3DBoundingVolume;
  /** Dictionary object with extension-specific objects. */
  extensions?: object;
  /** Application-specific data. */
  extras?: any;
};

/** A bounding volume that encloses a tile or its content.
 * https://github.com/CesiumGS/3d-tiles/tree/main/specification#bounding-volume
 */
export type Tile3DBoundingVolume = {
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

export type Tiles3DTileContent = {
  shape: 'tile3d';

  /** Common properties */
  byteOffset?: number;
  type?: string;
  featureIds?: null;

  /** 3DTile header */
  magic?: number;
  version?: number;
  byteLength?: number;

  /** 3DTile tables header */
  header?: {
    featureTableJsonByteLength?: number;
    featureTableBinaryByteLength?: number;
    batchTableJsonByteLength?: number;
    batchTableBinaryByteLength?: number;
    batchLength?: number;
  };

  /** 3DTile tables */
  featureTableJson?:
    | {
        BATCH_LENGTH?: number;
      }
    | Record<string, any>;
  featureTableBinary?: Uint8Array;
  batchTableJson?: Record<string, (string | number)[]>;
  batchTableBinary?: Uint8Array;
  rtcCenter?: number[];

  /** 3DTile glTF */
  gltfArrayBuffer?: ArrayBuffer;
  gltfByteOffset?: number;
  gltfByteLength?: number;
  rotateYtoZ?: boolean;
  gltfUpAxis?: 'x' | 'X' | 'y' | 'Y' | 'z' | 'Z';
  gltfUrl?: string;
  gpuMemoryUsageInBytes?: number;
  gltf?: GLTFPostprocessed;

  /** For Composite tiles */
  tilesLength?: number;
  tiles?: Tiles3DTileContent[];

  /** For Instances model and Pointcloud tiles */
  featuresLength?: number;

  /** For Instanced model tiles */
  gltfFormat?: number;
  eastNorthUp?: boolean;
  normalUp?: number[];
  normalRight?: number[];
  hasCustomOrientation?: boolean;
  octNormalUp?: number[];
  octNormalRight?: number[];
  instances?: {
    modelMatrix: Matrix4;
    batchId: number;
  }[];

  /** For Pointcloud tiles */
  attributes?: {
    positions: null | number[];
    colors:
      | null
      | number[]
      | {type: number; value: Uint8ClampedArray; size: number; normalized: boolean};
    normals: null | number[] | {type: number; size: number; value: Float32Array};
    batchIds: null | number[];
  };
  constantRGBA?: number[];
  isQuantized?: boolean;
  isTranslucent?: boolean;
  isRGB565?: boolean;
  isOctEncoded16P?: boolean;
  pointsLength?: number;
  pointCount?: number;
  batchIds?: number[];
  hasPositions?: boolean;
  hasColors?: boolean;
  hasNormals?: boolean;
  hasBatchIds?: boolean;
  quantizedVolumeScale?: Vector3;
  quantizedVolumeOffset?: Vector3;
  quantizedRange?: number;
  isQuantizedDraco?: boolean;
  octEncodedRange?: number;
  isOctEncodedDraco?: boolean;
};

/**
 * 3DTILES_implicit_tiling types
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 * JSON Schema v1.1 https://github.com/CesiumGS/3d-tiles/blob/8e5e67e078850cc8ce15bd1873fe54f11bbee02f/specification/schema/Subtree/subtree.schema.json
 * JSON Schema vNext https://github.com/CesiumGS/3d-tiles/blob/8e5e67e078850cc8ce15bd1873fe54f11bbee02f/extensions/3DTILES_implicit_tiling/schema/subtree/subtree.schema.json
 */
export type Subtree = {
  /** An array of buffers. */
  buffers: GLTFStyleBuffer[];
  /** An array of buffer views. */
  bufferViews: GLTFStyleBufferView[];
  /** The availability of tiles in the subtree. The availability bitstream is a 1D boolean array where tiles are ordered by their level in the subtree and Morton index
   * within that level. A tile's availability is determined by a single bit, 1 meaning a tile exists at that spatial index, and 0 meaning it does not.
   * The number of elements in the array is `(N^subtreeLevels - 1)/(N - 1)` where N is 4 for subdivision scheme `QUADTREE` and 8 for `OCTREE`.
   * Availability may be stored in a buffer view or as a constant value that applies to all tiles. If a non-root tile's availability is 1 its parent
   * tile's availability shall also be 1. `tileAvailability.constant: 0` is disallowed, as subtrees shall have at least one tile.
   */
  tileAvailability: Availability;
  /** It is array by spec but there are tiles that has a single object
   * An array of content availability objects. If the tile has a single content this array will have one element; if the tile has multiple contents -
   * as supported by 3DTILES_multiple_contents and 3D Tiles 1.1 - this array will have multiple elements.
   */
  contentAvailability: Availability | Availability[];
  /** The availability of children subtrees. The availability bitstream is a 1D boolean array where subtrees are ordered by their Morton index in the level of the tree
   * immediately below the bottom row of the subtree. A child subtree's availability is determined by a single bit, 1 meaning a subtree exists at that spatial index,
   * and 0 meaning it does not. The number of elements in the array is `N^subtreeLevels` where N is 4 for subdivision scheme `QUADTREE` and 8 for `OCTREE`.
   * Availability may be stored in a buffer view or as a constant value that applies to all child subtrees. If availability is 0 for all child subtrees,
   * then the tileset does not subdivide further.
   */
  childSubtreeAvailability: Availability;
  // TODO: These are unused properties. Improve types when they are required
  propertyTables?: unknown;
  tileMetadata?: unknown;
  contentMetadata?: unknown;
  subtreeMetadata?: unknown;
};

export type Availability = {
  /** Integer indicating whether all of the elements are available (1) or all are unavailable (0). */
  constant?: 0 | 1;
  /** Index of a buffer view that indicates whether each element is available. The bitstream conforms to the boolean array encoding described
   * in the 3D Metadata specification. If an element is available, its bit is 1, and if it is unavailable, its bit is 0. */
  bitstream?: number;
  /**
   * v1.1 https://github.com/CesiumGS/3d-tiles/blob/8e5e67e078850cc8ce15bd1873fe54f11bbee02f/specification/schema/Subtree/availability.schema.json
   * vNext https://github.com/CesiumGS/3d-tiles/blob/8e5e67e078850cc8ce15bd1873fe54f11bbee02f/extensions/3DTILES_implicit_tiling/schema/subtree/availability.schema.json
   * The schemas of vNext and 1.1 are same but there are tiles with `bufferView` property instead of `bitstream`
   */
  bufferView?: number;
  /**
   * Postprocessing property
   * contain availability bits loaded from the bufferView
   */
  explicitBitstream?: ExplicitBitstream;
};

export type ExplicitBitstream = Uint8Array;

/**
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling#subdivision-scheme
 */
export type SubdivisionScheme = 'QUADTREE' | 'OCTREE';

type GLTFStyleBuffer = {
  name: string;
  uri?: string;
  byteLength: number;
};

/** Subtree buffer view */
export type GLTFStyleBufferView = {
  buffer: number;
  byteOffset: number;
  byteLength: number;
};

/**
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 */
export type ImplicitTilingExensionData = ImplicitTilingData & {
  /** This property is not part of the schema
   * https://github.com/CesiumGS/3d-tiles/blob/main/extensions/3DTILES_implicit_tiling/schema/tile.3DTILES_implicit_tiling.schema.json
   * But it can be seen in some test datasets. It is handled as substitute of `availableLevels`
   */
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
