import GL from '@luma.gl/constants';

export const TYPE_ARRAY_MAP = {
  UInt8: Uint8Array,
  UInt16: Uint16Array,
  UInt32: Uint32Array,
  Float32: Float32Array,
  UInt64: Float64Array
};

export const GL_TYPE_MAP: {[key: string]: number} = {
  UInt8: GL.UNSIGNED_BYTE,
  UInt16: GL.UNSIGNED_INT,
  Float32: GL.FLOAT,
  UInt32: GL.UNSIGNED_INT,
  UInt64: GL.DOUBLE
};

export const I3S_NAMED_VERTEX_ATTRIBUTES = {
  position: 'position',
  normal: 'normal',
  uv0: 'uv0',
  color: 'color',
  region: 'region'
};

export const I3S_NAMED_GEOMETRY_ATTRIBUTES = {
  vertexAttributes: 'vertexAttributes',
  featureAttributeOrder: 'featureAttributeOrder',
  featureAttributes: 'featureAttributes'
};
// TODO Remove Named Attributes and replase with Typescipt types
export const I3S_NAMED_HEADER_ATTRIBUTES = {
  header: 'header',
  vertexCount: 'vertexCount',
  featureCount: 'featureCount'
};

export const SIZEOF: {[key: string]: number} = {
  UInt8: 1,
  UInt16: 2,
  UInt32: 4,
  Float32: 4,
  UInt64: 8
};

export const STRING_ATTRIBUTE_TYPE = 'String';
export const OBJECT_ID_ATTRIBUTE_TYPE = 'Oid32';
export const FLOAT_64_TYPE = 'Float64';
export const INT_16_ATTRIBUTE_TYPE = 'Int16';

// https://github.com/visgl/deck.gl/blob/9548f43cba2234a1f4877b6b17f6c88eb35b2e08/modules/core/src/lib/constants.js#L27
// Describes the format of positions
export const COORDINATE_SYSTEM = {
  // `LNGLAT` if rendering into a geospatial viewport, `CARTESIAN` otherwise
  DEFAULT: -1,
  // Positions are interpreted as [lng, lat, elevation]
  // lng lat are degrees, elevation is meters. distances as meters.
  LNGLAT: 1,

  // Positions are interpreted as meter offsets, distances as meters
  METER_OFFSETS: 2,

  // Positions are interpreted as lng lat offsets: [deltaLng, deltaLat, elevation]
  // deltaLng, deltaLat are delta degrees, elevation is meters.
  // distances as meters.
  LNGLAT_OFFSETS: 3,

  // Non-geospatial
  CARTESIAN: 0
};
