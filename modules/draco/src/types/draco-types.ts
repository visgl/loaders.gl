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

export declare function destroy(resource: any): void;
export declare function _malloc(byteLength: number): number;
export declare function _free(ptr: number): void;
export declare class HEAPF32 {
  static buffer: ArrayBuffer;
}

// ENUMS

// draco_EncodedGeometryType
export declare const INVALID_GEOMETRY_TYPE: number;
export declare const POINT_CLOUD: number;
export declare const TRIANGULAR_MESH: number;

// enum draco_GeometryAttribute_Type
export declare const INVALID: number;
export declare const POSITION: number;
export declare const NORMAL: number;
export declare const COLOR: number;
export declare const TEX_COORD: number;
export declare const GENERIC: number;

// draco_DataType
export declare const DT_INVALID: number;
export declare const DT_INT8: number;
export declare const DT_UINT8: number;
export declare const DT_INT16: number;
export declare const DT_UINT16: number;
export declare const DT_INT32: number;
export declare const DT_UINT32: number;
export declare const DT_INT64: number;
export declare const DT_UINT64: number;
export declare const DT_FLOAT32: number;
export declare const DT_FLOAT64: number;
export declare const DT_BOOL: number;
export declare const DT_TYPES_COUNT: number;
