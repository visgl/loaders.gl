import GL from '@luma.gl/constants';
import {DTYPE_LOOKUP} from '../../types';

export function TYPE_ARRAY_MAP(dType: string) {
  switch (dType) {
    case DTYPE_LOOKUP.UInt8:
      return Uint8Array;
    case DTYPE_LOOKUP.UInt16:
      return Uint16Array;
    case DTYPE_LOOKUP.UInt32:
      return Uint32Array;
    case DTYPE_LOOKUP.Float32:
      return Float32Array;
    case DTYPE_LOOKUP.UInt64:
      return Float64Array;
    default:
      return null;
  }
}

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
  // header: 'header',
  vertexCount: 'vertexCount',
  featureCount: 'featureCount'
};
/**
 * Returns how many bytes a type occupies
 * @param dType
 * @returns
 */
export function SIZEOF(dType: string): number {
  switch (dType) {
    case DTYPE_LOOKUP.UInt8:
      return 1;
    case DTYPE_LOOKUP.UInt16:
    case DTYPE_LOOKUP.Int16:
      return 2;
    case DTYPE_LOOKUP.UInt32:
    case DTYPE_LOOKUP.Int32:
    case DTYPE_LOOKUP.Float32:
      return 4;
    case DTYPE_LOOKUP.UInt64:
    case DTYPE_LOOKUP.Int64:
    case DTYPE_LOOKUP.Float64:
      return 8;
    default:
      return NaN;
  }
}

export const STRING_ATTRIBUTE_TYPE = 'String';
export const OBJECT_ID_ATTRIBUTE_TYPE = 'Oid32';
export const FLOAT_64_TYPE = 'Float64';
export const INT_16_ATTRIBUTE_TYPE = 'Int16';

// https://github.com/visgl/deck.gl/blob/9548f43cba2234a1f4877b6b17f6c88eb35b2e08/modules/core/src/lib/constants.js#L27
// Describes the format of positions
export enum COORDINATE_SYSTEM {
  /**
   * `LNGLAT` if rendering into a geospatial viewport, `CARTESIAN` otherwise
   */
  DEFAULT = -1,
  /**
   * Positions are interpreted as [lng, lat, elevation]
   * lng lat are degrees, elevation is meters. distances as meters.
   */
  LNGLAT = 1,
  /**
   * Positions are interpreted as meter offsets, distances as meters
   */
  METER_OFFSETS = 2,
  /**
   * Positions are interpreted as lng lat offsets: [deltaLng, deltaLat, elevation]
   * deltaLng, deltaLat are delta degrees, elevation is meters.
   * distances as meters.
   */
  LNGLAT_OFFSETS = 3,
  /**
   * Non-geospatial
   */
  CARTESIAN = 0
}
