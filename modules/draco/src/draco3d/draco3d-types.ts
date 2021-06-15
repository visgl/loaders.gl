// A set of typescript types manually adapted from the Draco web IDL
// Draco JS is a bit tricky to work with due to the C++ emscripten code base
// sparse documentation, so these types provide an extra safety net.

// Typescript defs adapted from draco3d emscripten IDL
// https://raw.githubusercontent.com/google/draco/master/src/draco/javascript/emscripten/draco_web_decoder.idl
// Interface exposed to emscripten's WebIDL Binder.
// http://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/WebIDL-Binder.html

/* eslint-disable camelcase */

/** Draco3D untyped memory pointer */
type VoidPtr = any;

// DRACO WEB DECODER IDL

/** Draco3D geometry attribute type */
export enum draco_GeometryAttribute_Type {
  'draco_GeometryAttribute::INVALID',
  'draco_GeometryAttribute::POSITION',
  'draco_GeometryAttribute::NORMAL',
  'draco_GeometryAttribute::COLOR',
  'draco_GeometryAttribute::TEX_COORD',
  'draco_GeometryAttribute::GENERIC'
}

/** Draco3D encoded geometry type */
export enum draco_EncodedGeometryType {
  'draco::INVALID_GEOMETRY_TYPE',
  'draco::POINT_CLOUD',
  'draco::TRIANGULAR_MESH'
}

/** Draco3D data type */
export enum draco_DataType {
  'draco::DT_INVALID',
  'draco::DT_INT8',
  'draco::DT_UINT8',
  'draco::DT_INT16',
  'draco::DT_UINT16',
  'draco::DT_INT32',
  'draco::DT_UINT32',
  'draco::DT_INT64',
  'draco::DT_UINT64',
  'draco::DT_FLOAT32',
  'draco::DT_FLOAT64',
  'draco::DT_BOOL',
  'draco::DT_TYPES_COUNT'
}

/** Draco3D status code */
export enum draco_StatusCode {
  'draco_Status::OK',
  'draco_Status::DRACO_ERROR',
  'draco_Status::IO_ERROR',
  'draco_Status::INVALID_PARAMETER',
  'draco_Status::UNSUPPORTED_VERSION',
  'draco_Status::UNKNOWN_VERSION'
}

/** Draco3D decoder buffer allocated on emscripten heap */
export declare class DecoderBuffer {
  constructor();
  Init(data: Int8Array, data_size: number): void;
}

/** Draco3D attribute transform data */
export declare class AttributeTransformData {
  constructor();
  transform_type(): number;
}

/** Draco3D geometry attribute */
export declare class GeometryAttribute {
  constructor();
}

/** Draco3D point attribute */
export declare class PointAttribute {
  ptr: VoidPtr;

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

/** Draco3D attribute transform */
export declare class AttributeQuantizationTransform {
  constructor();
  InitFromAttribute(att: PointAttribute): boolean;
  quantization_bits(): number;
  min_value(axis: number): number;
  range(): number;
}

/** Draco3D attribute transform */
export declare class AttributeOctahedronTransform {
  constructor();
  InitFromAttribute(att: PointAttribute): boolean;
  quantization_bits(): number;
}

/** Draco3D point cloud */
export declare class PointCloud {
  ptr: VoidPtr;

  constructor();
  num_attributes(): number;
  num_points(): number;
}

/** Draco3D mesh */
export declare class Mesh extends PointCloud {
  constructor();
  num_faces(): number;
}

/** Draco3D metadata */
export declare class Metadata {
  ptr: VoidPtr;

  constructor();
}

/** Draco3D status */
export declare class Status {
  constructor();
  code(): draco_StatusCode;
  ok(): boolean;
  error_msg(): string;
}

/** Draco3D Float32Array allocated on the emscripten heap */
export declare class DracoFloat32Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D Int8Array allocated on the emscripten heap */
export declare class DracoInt8Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D Uint8Array allocated on the emscripten heap */
export declare class DracoUInt8Array {
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D Int16Array allocated on the emscripten heap */
export declare class DracoInt16Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D Uint16Array allocated on the emscripten heap */
export declare class DracoUInt16Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D Int32Array allocated on the emscripten heap */
export declare class DracoInt32Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D Uint32Array allocated on the emscripten heap */
export declare class DracoUInt32Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}

/** Draco3D metadata querier */
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
 * Draco3D Decoder class
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

// DRACO WEB ENCODER IDL

/** Draco3D metadata builder */
export declare class MetadataBuilder {
  constructor();
  AddStringEntry(metadata: Metadata, entry_name: string, entry_value: string);
  AddIntEntry(metadata: Metadata, entry_name: string, entry_value: number);
  AddDoubleEntry(metadata: Metadata, entry_name: string, entry_value: number);
  AddIntEntryArray(
    metadata: Metadata,
    entry_name: string,
    entry_value: Int32Array,
    num_values: number
  );
}

/** Draco3D point cloud builder */

export declare class PointCloudBuilder {
  constructor();
  PointCloudBuilder(): void;
  AddFloatAttribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Float32Array
  );
  AddInt8Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Int8Array
  );
  AddUInt8Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Uint8Array
  );
  AddInt16Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Int16Array
  );
  AddUInt16Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Uint16Array
  );
  AddInt32Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Int32Array
  );
  AddUInt32Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Uint32Array
  );

  AddMetadata(pc: PointCloud, metadata: Metadata): boolean;
  SetMetadataForAttribute(pc: PointCloud, attribute_id: number, metadata: Metadata);
}

/** Draco3D mesh builder */
export declare class MeshBuilder extends PointCloudBuilder {
  constructor();
  AddFacesToMesh(mesh: Mesh, num_faces: number, faces: number[]): boolean;
}

/** Draco3D encoder */
export declare class Encoder {
  constructor();
  Encoder(): void;
  SetEncodingMethod(method: number): void;
  SetAttributeQuantization(type: draco_GeometryAttribute_Type, quantization_bits: number);
  SetAttributeExplicitQuantization(
    type: draco_GeometryAttribute_Type,
    quantization_bits: number,
    num_components: number,
    origin: number[],
    range: number
  );
  SetSpeedOptions(encoding_speed: number, decoding_speed: number): void;
  SetTrackEncodedProperties(flag: boolean): void;

  EncodeMeshToDracoBuffer(mesh: Mesh, encoded_data: DracoInt8Array);
  EncodePointCloudToDracoBuffer(
    pc: PointCloud,
    deduplicate_values: boolean,
    encoded_data: DracoInt8Array
  );

  // Returns the number of encoded points or faces from the last Encode
  // operation. Returns 0 if SetTrackEncodedProperties was not set to true.
  GetNumberOfEncodedPoints(): number;
  GetNumberOfEncodedFaces(): number;
}

/** Draco3D expert encoder */
export declare class ExpertEncoder {
  constructor();
  ExpertEncoder(pc: PointCloud): void;
  SetEncodingMethod(method: number): void;
  SetAttributeQuantization(att_id: number, quantization_bits: number);
  SetAttributeExplicitQuantization(
    att_id: number,
    quantization_bits: number,
    num_components: number,
    origin: number[],
    range: number
  );
  SetSpeedOptions(encoding_speed: number, decoding_speed: number): void;
  SetTrackEncodedProperties(flag: boolean): void;

  EncodeToDracoBuffer(deduplicate_values: boolean, encoded_data: DracoInt8Array);

  // Returns the number of encoded points or faces from the last Encode
  // operation. Returns 0 if SetTrackEncodedProperties was not set to true.
  GetNumberOfEncodedPoints(): number;
  GetNumberOfEncodedFaces(): number;
}

/** Draco3D module interface */
export interface Draco3D {
  // ENUMS

  // draco_EncodedGeometryType
  readonly INVALID_GEOMETRY_TYPE: draco_EncodedGeometryType;
  readonly POINT_CLOUD: draco_EncodedGeometryType;
  readonly TRIANGULAR_MESH: draco_EncodedGeometryType;

  // enum draco_GeometryAttribute_Type
  readonly INVALID: draco_GeometryAttribute_Type;
  readonly POSITION: draco_GeometryAttribute_Type;
  readonly NORMAL: draco_GeometryAttribute_Type;
  readonly COLOR: draco_GeometryAttribute_Type;
  readonly TEX_COORD: draco_GeometryAttribute_Type;
  readonly GENERIC: draco_GeometryAttribute_Type;

  // enum draco_DataType
  readonly DT_INVALID: draco_DataType;
  readonly DT_INT8: draco_DataType;
  readonly DT_UINT8: draco_DataType;
  readonly DT_INT16: draco_DataType;
  readonly DT_UINT16: draco_DataType;
  readonly DT_INT32: draco_DataType;
  readonly DT_UINT32: draco_DataType;
  readonly DT_INT64: draco_DataType;
  readonly DT_UINT64: draco_DataType;
  readonly DT_FLOAT32: draco_DataType;
  readonly DT_FLOAT64: draco_DataType;
  readonly DT_BOOL: draco_DataType;
  readonly DT_TYPES_COUNT: draco_DataType;

  readonly Mesh: typeof Mesh;
  readonly PointCloud: typeof PointCloud;
  readonly Metadata: typeof Metadata;

  readonly Encoder: typeof Encoder;
  readonly MeshBuilder: typeof MeshBuilder;
  readonly MetadataBuilder: typeof MetadataBuilder;

  readonly MetadataQuerier: typeof MetadataQuerier;
  readonly Decoder: typeof Decoder;
  readonly DecoderBuffer: typeof DecoderBuffer;

  readonly DracoFloat32Array: typeof DracoFloat32Array;
  readonly DracoInt8Array: typeof DracoInt8Array;
  readonly DracoUInt8Array: typeof DracoUInt8Array;
  readonly DracoInt16Array: typeof DracoInt16Array;
  readonly DracoUInt16Array: typeof DracoUInt16Array;
  readonly DracoInt32Array: typeof DracoInt32Array;
  readonly DracoUInt32Array: typeof DracoUInt32Array;

  readonly AttributeQuantizationTransform: typeof AttributeQuantizationTransform;

  // createEncoderModule(): Encoder;
  // createDecoderModule(): Decoder;
  destroy(resource: any): void;
  _malloc(byteLength: number): number;
  _free(ptr: number): void;

  HEAPF32: {
    buffer: ArrayBuffer;
  };
}
