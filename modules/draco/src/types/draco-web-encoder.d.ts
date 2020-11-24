// Interface exposed to emscripten's WebIDL Binder.
// http://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/WebIDL-Binder.html
/* eslint-disable camelcase */

import {
  // GeometryAttribute,
  // PointAttribute,
  PointCloud,
  Mesh,
  Metadata,
  DracoInt8Array
} from './draco-web-decoder';


type draco_GeometryAttribute_Type = number;
type draco_EncodedGeometryType = number;
type draco_MeshEncoderMethod = number;

/*
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

enum draco_MeshEncoderMethod {
  "draco::MESH_SEQUENTIAL_ENCODING",
  "draco::MESH_EDGEBREAKER_ENCODING"
};
*/

/*
export class GeometryAttribute {
  constructor();
}

export class PointAttribute {
  constructor();
  size(): number;

  // From GeometryAttribute
  attribute_type(): number;
  data_type(): number;
  num_components(): number;
  normalized(): boolean;
  byte_stride(): number;
  byte_offset(): number;
  unique_id(): number;
}

export class PointCloud {
  constructor();
  num_attributes(): number;
  num_points(): number;
}

export class Mesh extends PointCloud {
  constructor();
  num_faces(): number;

  // From PointCloud
  num_attributes(): number;
  num_points(): number;
  set_num_points(num_points: number): void;
}

export class Metadata {
  constructor();
}

export class DracoInt8Array {
  constructor();
  GetValue(index: number): number;
  size(): number;
}
*/

export class MetadataBuilder {
  constructor();
  AddStringEntry(metadata: Metadata, entry_name: string, entry_value: string);
  AddIntEntry(metadata: Metadata, entry_name: string, entry_value: number);
  AddDoubleEntry(metadata: Metadata, entry_name: string, entry_value: number);
}

export class PointCloudBuilder {
  constructor();
  PointCloudBuilder(): void;
  AddFloatAttribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Float32Array);
  AddInt8Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Int8Array);
  AddUInt8Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number,
    num_components: number,
    att_values: Uint8Array);
  AddInt16Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number, num_components: number,
    att_values: Int16Array);
  AddUInt16Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number, num_components: number,
    att_values: Uint16Array);
  AddInt32Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number, num_components: number,
    att_values: Int32Array);
  AddUInt32Attribute(
    pc: PointCloud,
    type: draco_GeometryAttribute_Type,
    num_vertices: number, num_components: number,
    att_values: Uint32Array);

  AddMetadata(pc: PointCloud, metadata: Metadata): boolean;
  SetMetadataForAttribute(pc: PointCloud, attribute_id: number, metadata: Metadata);
}

export class MeshBuilder extends PointCloudBuilder {
  constructor();
  AddFacesToMesh(mesh: Mesh, num_faces: number, faces: number[]): boolean;
}

export class Encoder {
  constructor();
  Encoder(): void;
  SetEncodingMethod(method: number): void;
  SetAttributeQuantization(
    type: draco_GeometryAttribute_Type,
    quantization_bits: number);
  SetAttributeExplicitQuantization(
    type: draco_GeometryAttribute_Type,
    quantization_bits: number,
    num_components: number,
    origin: number[],
    range: number);
  SetSpeedOptions(encoding_speed: number, decoding_speed: number): void;
  SetTrackEncodedProperties(flag: boolean): void;

  EncodeMeshToDracoBuffer(
    mesh: Mesh,
    encoded_data: DracoInt8Array
  );
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

export class ExpertEncoder {
  constructor();
  ExpertEncoder(pc: PointCloud): void;
  SetEncodingMethod(method: number): void;
  SetAttributeQuantization(att_id: number, quantization_bits: number);
  SetAttributeExplicitQuantization(
    att_id: number,
    quantization_bits: number,
    num_components: number,
    origin: number[],
    range: number);
  SetSpeedOptions(encoding_speed: number, decoding_speed: number): void;
  SetTrackEncodedProperties(flag: boolean): void;

  EncodeToDracoBuffer(
    deduplicate_values: boolean,
    encoded_data: DracoInt8Array
  );

  // Returns the number of encoded points or faces from the last Encode
  // operation. Returns 0 if SetTrackEncodedProperties was not set to true.
  GetNumberOfEncodedPoints(): number;
  GetNumberOfEncodedFaces(): number;
}