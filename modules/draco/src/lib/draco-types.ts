/* eslint-disable camelcase */

import {Mesh} from '@loaders.gl/schema';

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
  name?: string;

  quantization_transform?: DracoQuantizationTransform;
  octahedron_transform?: DracoOctahedronTransform;

  metadata: {[key: string]: DracoMetadataEntry};
  attribute_index: number;
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
export type DracoMesh = Mesh & {
  loader: 'draco';
  loaderData: DracoLoaderData; // Draco specific data
};
