// Typescript defs adapted from draco3d emscripten IDL
// https://raw.githubusercontent.com/google/draco/master/src/draco/javascript/emscripten/draco_web_decoder.idl
// Interface exposed to emscripten's WebIDL Binder.
// http://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/WebIDL-Binder.html
/* eslint-disable camelcase */

// TODO
type VoidPtr = any;

type draco_AttributeTransformType = number;
type draco_GeometryAttribute_Type = number;
type draco_EncodedGeometryType = number;
type draco_DataType = number;
type draco_StatusCode = number;

/*
// TODO(fgalligan): Can we remove this?
enum draco_AttributeTransformType {
  "draco::ATTRIBUTE_INVALID_TRANSFORM",
  "draco::ATTRIBUTE_NO_TRANSFORM",
  "draco::ATTRIBUTE_QUANTIZATION_TRANSFORM",
  "draco::ATTRIBUTE_OCTAHEDRON_TRANSFORM"
};

enum draco_GeometryAttribute_Type {
  "draco_GeometryAttribute::INVALID",
  "draco_GeometryAttribute::POSITION",
  "draco_GeometryAttribute::NORMAL",
  "draco_GeometryAttribute::COLOR",
  "draco_GeometryAttribute::TEX_COORD",
  "draco_GeometryAttribute::GENERIC"
};

enum draco_EncodedGeometryType {
  "draco::INVALID_GEOMETRY_TYPE",
  "draco::POINT_CLOUD",
  "draco::TRIANGULAR_MESH"
};

enum draco_DataType {
  "draco::DT_INVALID",
  "draco::DT_INT8",
  "draco::DT_UINT8",
  "draco::DT_INT16",
  "draco::DT_UINT16",
  "draco::DT_INT32",
  "draco::DT_UINT32",
  "draco::DT_INT64",
  "draco::DT_UINT64",
  "draco::DT_FLOAT32",
  "draco::DT_FLOAT64",
  "draco::DT_BOOL",
  "draco::DT_TYPES_COUNT"
};

enum draco_StatusCode {
  "draco_Status::OK",
  "draco_Status::DRACO_ERROR",
  "draco_Status::IO_ERROR",
  "draco_Status::INVALID_PARAMETER",
  "draco_Status::UNSUPPORTED_VERSION",
  "draco_Status::UNKNOWN_VERSION",
};
*/

/** A memory buffer to decode Draco meshes from */
export declare class DecoderBuffer {
  constructor();
  Init(data: Int8Array, data_size: number): void;
}

export declare class AttributeTransformData {
  constructor();
  transform_type(): number;
}

export declare class GeometryAttribute {
  constructor();
}

export declare class PointAttribute {
  constructor();
  size(): number;
  GetAttributeTransformData(): AttributeTransformData;

  // From GeometryAttribute
  attribute_type(): number;
  data_type(): number;
  num_components(): number;
  normalized(): boolean;
  byte_stride(): number;
  byte_offset(): number;
  unique_id(): number;
}

export declare class AttributeQuantizationTransform {
  constructor();
  InitFromAttribute(att: PointAttribute): boolean;
  quantization_bits(): number;
  min_value(axis: number): number;
  range(): number;
}

export declare class AttributeOctahedronTransform {
  constructor();
  InitFromAttribute(att: PointAttribute): boolean;
  quantization_bits(): number;
}

export declare class PointCloud {
  constructor();
  num_attributes(): number;
  num_points(): number;
}

export declare class Mesh extends PointCloud {
  constructor();

  num_faces(): number;

  // From PointCloud
  // num_attributes(): number;
  // num_points(): number;
}

export declare class Metadata {
  constructor();
}

export declare class Status {
  constructor();
  code(): draco_StatusCode;
  ok(): boolean;
  error_msg(): string;
}

// Draco version of typed arrays. The memory of these arrays is allocated on the
// emscripten heap.
export declare class DracoFloat32Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

export declare class DracoInt8Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

export declare class DracoUInt8Array {
  GetValue(index: number): number;
  size(): number;
}

export declare class DracoInt16Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

export declare class DracoUInt16Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

export declare class DracoInt32Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

export declare class DracoUInt32Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

export declare class MetadataQuerier {
  constructor();

  HasEntry(metadata: Metadata, entry_name: string): string;
  GetIntEntry(metadata: Metadata, entry_name: string);
  GetIntEntryArray(metadata: Metadata, entry_name: string, out_values: DracoInt32Array);
  GetDoubleEntry(metadata: Metadata, entry_name: string): number;
  GetStringEntry(metadata: Metadata, entry_name: string): string;

  NumEntries(metadata: Metadata): number;
  GetEntryName(metadata: Metadata, entry_id: number): string;
}

/**
 * Main Decoder class
 */
export declare class Decoder {
  constructor();

  GetEncodedGeometryType(in_buffer: DecoderBuffer): draco_EncodedGeometryType;

  DecodeBufferToPointCloud(in_buffer: DecoderBuffer, out_point_cloud: PointCloud): Status;
  DecodeBufferToMesh(in_buffer: DecoderBuffer, out_mesh: Mesh): Status;

  GetAttributeId(pc: PointCloud, type: draco_GeometryAttribute_Type): number;
  GetAttributeIdByName(pc: PointCloud, name: string): number;
  GetAttributeIdByMetadataEntry(pc: PointCloud, name: string, value: string): number;

  GetAttribute(pc: PointCloud, att_id: number): PointAttribute;
  GetAttributeByUniqueId(pc: PointCloud, unique_id: number): PointAttribute;

  GetMetadata(pc: PointCloud): Metadata;
  GetAttributeMetadata(pc: PointCloud, att_id: number): Metadata;

  GetFaceFromMesh(m: Mesh, face_id: number, out_values: DracoInt32Array): boolean;
  GetTriangleStripsFromMesh(m: Mesh, strip_values: DracoInt32Array);

  GetTrianglesUInt16Array(m: Mesh, out_size: number, out_values: VoidPtr): boolean;
  GetTrianglesUInt32Array(m: Mesh, out_size: number, out_values: VoidPtr): boolean;

  GetAttributeFloat(pa: PointAttribute, att_index: number, out_values: DracoFloat32Array): boolean;

  GetAttributeFloatForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoFloat32Array
  ): boolean;

  // Deprecated, use GetAttributeInt32ForAllPoints instead.
  GetAttributeIntForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoInt32Array
  ): boolean;

  GetAttributeInt8ForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoInt8Array
  ): boolean;
  GetAttributeUInt8ForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoUInt8Array
  ): boolean;
  GetAttributeInt16ForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoInt16Array
  ): boolean;
  GetAttributeUInt16ForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoUInt16Array
  ): boolean;
  GetAttributeInt32ForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoInt32Array
  ): boolean;
  GetAttributeUInt32ForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    out_values: DracoUInt32Array
  ): boolean;

  GetAttributeDataArrayForAllPoints(
    pc: PointCloud,
    pa: PointAttribute,
    data_type: draco_DataType,
    out_size: number,
    out_values: VoidPtr
  ): boolean;

  SkipAttributeTransform(att_type: draco_GeometryAttribute_Type): void;
}
