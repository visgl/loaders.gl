/* eslint-disable camelcase */

// MESH CATEGORY DATA
// TODO - should be imported from `@loaders.gl/schema`

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

/**
 * luma.gl compatible attribute descriptors
 * Can be mapped to any WebGL framework
 */
export type MeshAttribute = {
  value: TypedArray;
  size: number;
  byteOffset?: number;
  byteStride?: number;
  normalized?: boolean;
};

/** Standard mesh */
export type MeshData = {
  loader?: string;
  loaderData?: any;
  header?: {
    vertexCount: number;
    boundingBox?: [number[], number[]];
  };
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  mode: number;
  attributes: {[attributeName: string]: MeshAttribute};
  indices?: MeshAttribute;
};

// DRACO FORMAT SPECIFIC DATA

export type DracoMetadataEntry = {
  int: number;
  string: string;
  double: number;
  intArray: Int32Array;
};

/** For attributes that have not been fully decompressed */
export type DracoQuantizationTransform = {
  quantization_bits?: number;
  range?: number;
  min_values?: Float32Array;
};

/** For attributes that have not been fully decompressed */
export type DracoOctahedronTransform = {
  quantization_bits?: number;
};

/** Draco attribute fields */
export type DracoAttribute = {
  unique_id: number;

  num_components: number; // Duplicate of size
  attribute_type: number;
  data_type: number;

  byte_offset: number;
  byte_stride: number;
  normalized: boolean;

  quantization_transform?: DracoQuantizationTransform;
  octahedron_transform?: DracoOctahedronTransform;

  metadata: {[key: string]: DracoMetadataEntry};
};

/**
 * Draco format specific data
 * The `data.loaderData` field will have this layout when `data.loader === 'draco'`.
 * @todo Metadata should also be available in normalized form in a standard `Schema`.
 */
export type DracoLoaderData = {
  geometry_type: number;
  num_attributes: number;
  num_points: number;
  num_faces: number;
  metadata: {[entry: string]: DracoMetadataEntry};
  attributes: {[unique_id: number]: DracoAttribute};
  // attribute_names?: {[unique_id: number]: string};
  // unique_ids?: {[attributeName: string]: number};
};

/**
 * loaders.gl Mesh with Draco specific data
 */
export type DracoMeshData = {
  loader: string; // 'draco';
  // Draco specific data
  loaderData: DracoLoaderData;
  // Standard mesh
  header?: {
    vertexCount: number;
    boundingBox?: [number[], number[]];
  };
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  mode: number;
  attributes: {[attributeName: string]: MeshAttribute};
  indices?: MeshAttribute;
};
