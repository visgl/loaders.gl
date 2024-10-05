// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/**
 * MVT spec constants
 * @see https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md
 */
export enum TileInfo {
  /** repeated Layer */
  layers = 3
}

/**
 * MVT spec constants
 * @see https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md
 * @note Layers are described in section 4.1 of the specification
 */
export enum LayerInfo {
  /**
   * Any compliant implementation must first read the version
   * number encoded in this message and choose the correct
   * implementation for this version number before proceeding to
   * decode other parts of this message.
   * required uint32  [ default = 1 ];
   */
  version = 15,

  /** PBF: required string */
  name = 1,

  /** The actual features in this tile.
   * PBF: repeated Feature
   */
  features = 2,

  /**
   * Dictionary encoding for keys
   * PBF: repeated string
   */
  keys = 3,

  /**
   * Dictionary encoding for values
   * PBF: repeated Value
   */
  values = 4,

  /**
   * Although this is an "optional" field it is required by the specification.
   * See https://github.com/mapbox/vector-tile-spec/issues/47
   * PBF: optional uint32 [ default = 4096 ];
   */
  extent = 5

  // extensions 16 to max;
}

/**
 * @see https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md
 * Features are described in section 4.2 of the specification
 */
export enum FeatureInfo {
  /** optional uint64 [ default = 0 ]; */
  id = 1,

  /**
   * Tags of this feature are encoded as repeated pairs of integers.
   * A detailed description of tags is located in sections 4.2 and 4.4 of the specification
   * repeated uint32  [ packed = true ];
   */
  tags = 2,

  /**
   * The type of geometry stored in this feature.
   * GeomType  [ default = UNKNOWN ];
   */
  type = 3,

  /**
   * Contains a stream of commands and parameters (vertices).
   * A detailed description on geometry encoding is located in
   * section 4.3 of the specification.
   * repeated uint32  [ packed = true ];
   */
  geometry = 4
}

/**
 * GeomType is described in section 4.3.4 of the specification
 * @see https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md
 * */
export enum GeometryType {
  UNKNOWN = 0,
  POINT = 1,
  LINESTRING = 2,
  POLYGON = 3
}

/**
 * Variant type encoding
 * The use of values is described in section 4.1 of the specification
 * @note Exactly one of these values must be present in a valid message
 * @see https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md
 */
export enum PropertyType {
  /** string */ 
  string_value = 1, // 
  /** float */ 
  float_value = 2, 
  /** double */ 
  double_value = 3, 
  /** int64 */ 
  int_value = 4, 
  /** uint64 */ 
  uint_value = 5, 
  /** sint64 */ 
  sint_value = 6, 
  /** bool */ 
  bool_value = 7 
  // extensions 8 to max;
}

/**
 * "Turtle graphics" style geometry commands
 * @see https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md
 */
export enum Command {
  /** 2 Parameters: dX, dY */
  MoveTo = 1,
  /** 2 Parameters dX, dY */
  LineTo = 2,
  /** No parameters */
  ClosePath = 7
}
