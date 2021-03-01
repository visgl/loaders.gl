import GL from '@luma.gl/constants';

export const TYPE_ARRAY_MAP = {
  UInt8: Uint8Array,
  UInt16: Uint16Array,
  UInt32: Uint32Array,
  Float32: Float32Array,
  // eslint-disable-next-line no-undef
  UInt64: BigUint64Array
};

export const GL_TYPE_MAP = {
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

export const I3S_NAMED_HEADER_ATTRIBUTES = {
  header: 'header',
  vertexCount: 'vertexCount',
  featureCount: 'featureCount'
};

export const SIZEOF = {
  UInt8: 1,
  UInt16: 2,
  UInt32: 4,
  Float32: 4,
  UInt64: 8
};

export const STRING_ATTRIBUTE_TYPE = 'String';
export const OBJECT_ID_ATTRIBUTE_TYPE = 'Oid32';
export const FLOAT_64_TYPE = 'Float64';
