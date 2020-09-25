// A set of typescript types manually adapted from the Draco web IDL
// Draco JS is a bit tricky to work with due to the C++ emscripten code base
// sparse documentation, so these types provide an extra safety net.

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

export {
  DecoderBuffer,
  AttributeTransformData,
  GeometryAttribute,
  PointAttribute,
  AttributeQuantizationTransform,
  AttributeOctahedronTransform,
  PointCloud,
  Mesh,
  Metadata,
  Status,
  DracoFloat32Array,
  DracoInt8Array,
  DracoUInt8Array,
  DracoInt16Array,
  DracoUInt16Array,
  DracoInt32Array,
  DracoUInt32Array,
  MetadataQuerier,
  Decoder
} from './draco-web-decoder';

export {
  // GeometryAttribute,
  // PointAttribute,
  // PointCloud,
  // Mesh,
  // Metadata,
  // DracoInt8Array,
  MetadataBuilder,
  PointCloudBuilder,
  MeshBuilder,
  Encoder,
  ExpertEncoder
} from './draco-web-encoder';

export function destroy(resource: any): void;

// ENUMS

// draco_EncodedGeometryType
export const INVALID_GEOMETRY_TYPE: number;
export const POINT_CLOUD: number;
export const TRIANGULAR_MESH: number;

// enum draco_GeometryAttribute_Type
export const INVALID: number;
export const POSITION: number;
export const NORMAL: number;
export const COLOR: number;
export const TEX_COORD: number;
export const GENERIC: number;
