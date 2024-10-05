// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/** GeomType is described in section 4.3.4 of the specification */
export enum GeometryType {
  UNKNOWN = 0,
  POINT = 1,
  LINESTRING = 2,
  POLYGON = 3
}

// Variant type encoding
// The use of values is described in section 4.1 of the specification
export enum PropertyType {
  // Exactly one of these values must be present in a valid message
  string = 1, // string_value
  float = 2, // float_value
  double = 3, // double_value
  int64 = 4, // int_value
  uint64 = 5, // uint_value
  sint64 = 6, // sint_value
  bool = 7 // bool_value
  // extensions 8 to max;
}

// Features are described in section 4.2 of the specification
export enum FeatureInfoType {
  // optional uint64 [ default = 0 ];
  id = 1,

  // Tags of this feature are encoded as repeated pairs of integers.
  // A detailed description of tags is located in sections 4.2 and 4.4 of the specification
  // repeated uint32  [ packed = true ];
  tags = 2,

  /**
   * The type of geometry stored in this feature.
   * GeomType  [ default = UNKNOWN ];
   */
  type = 3,

  // Contains a stream of commands and parameters (vertices).
  // A detailed description on geometry encoding is located in
  // section 4.3 of the specification.
  geometry = 4 // repeated uint32  [ packed = true ];
}

// Layers are described in section 4.1 of the specification
export enum LayerInfoType {
  // Any compliant implementation must first read the version
  // number encoded in this message and choose the correct
  // implementation for this version number before proceeding to
  // decode other parts of this message.
  version = 15, // required uint32  [ default = 1 ];

  name = 1, // required string

  // The actual features in this tile.
  features = 2, // repeated Feature

  // Dictionary encoding for keys
  keys = 3, // repeated string

  // Dictionary encoding for values
  values = 4, // repeated Value

  // Although this is an "optional" field it is required by the specification.
  // See https://github.com/mapbox/vector-tile-spec/issues/47
  extent = 5 // optional uint32 [ default = 4096 ];

  // extensions 16 to max;
}

export enum TileInfoType {
  layers = 3 // repeated Layer
}
