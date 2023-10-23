// loaders.gl, MIT license

const EWKB_FLAG_Z = 0x80000000;
const EWKB_FLAG_M = 0x40000000;
const EWKB_FLAG_SRID = 0x20000000;

const MAX_SRID = 10000; // TBD: Assume no more than 10K SRIDs are defined

/**
 * Integer code for geometry types in WKB and related formats
 * Reference: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 */
export enum WKBGeometryType {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7
}

/** Parsed WKB header */
export type WKBHeader = {
  /** WKB variant */
  type: 'wkb' | 'ewkb' | 'iso-wkb' | 'twkb';
  /** geometry type encoded in this WKB: point, line, polygon etc */
  geometryType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Number of dimensions for coordinate data */
  dimensions: 2 | 3 | 4;
  /** Coordinate names, Z and M are controlled by flags */
  coordinates: 'xy' | 'xyz' | 'xym' | 'xyzm';
  srid?: number;
  /** true if binary data is stored as little endian */
  littleEndian: boolean;
  /** Offset to start of geometry */
  byteOffset: number;
};

/** Sanity checks that first to 5-9 bytes could represent a supported WKB dialect header */
export function isWKB(arrayBuffer: ArrayBuffer): boolean {
  const dataView = new DataView(arrayBuffer);
  let byteOffset = 0;

  const endianness = dataView.getUint8(byteOffset);
  byteOffset += 1;

  // Check valid endianness (only 0 or 1 are allowed)
  if (endianness > 1) {
    return false;
  }

  const littleEndian = endianness === 1;

  const geometry = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  // check valid geometry type (we don't support extension geometries)
  const geometryType = geometry & 0x07;
  if (geometryType === 0 || geometryType > 7) {
    return false;
  }

  const geometryFlags = geometry - geometryType;

  // Accept iso-wkb flags
  if (
    geometryFlags === 0 ||
    geometryFlags === 1000 ||
    geometryFlags === 2000 ||
    geometryFlags === 3000
  ) {
    return true;
  }

  // Accept ewkb flags but reject otherwise
  if ((geometryFlags & ~(EWKB_FLAG_Z | EWKB_FLAG_M | EWKB_FLAG_SRID)) !== 0) {
    return false;
  }

  if (geometryFlags & EWKB_FLAG_SRID) {
    const srid = dataView.getUint32(byteOffset, littleEndian);
    byteOffset += 4;

    if (srid > MAX_SRID) {
      return false;
    }
  }

  return true;
}

/**
 * Parses header and provides a byteOffset to start of geometry data
 * @param dataView
 * @param target optionally supply a WKBHeader object to avoid creating a new object for every call
 * @returns a header object describing the WKB data
 */
// eslint-disable-next-line max-statements
export function parseWKBHeader(dataView: DataView, target?: WKBHeader): WKBHeader {
  const wkbHeader: WKBHeader = Object.assign(target || {}, {
    type: 'wkb',
    geometryType: 1,
    dimensions: 2,
    coordinates: 'xy',
    littleEndian: true,
    byteOffset: 0
  } as WKBHeader);

  // Check endianness of data
  wkbHeader.littleEndian = dataView.getUint8(wkbHeader.byteOffset) === 1;
  wkbHeader.byteOffset++;

  // 4-digit code representing dimension and type of geometry
  const geometryCode = dataView.getUint32(wkbHeader.byteOffset, wkbHeader.littleEndian);
  wkbHeader.byteOffset += 4;

  wkbHeader.geometryType = (geometryCode & 0x7) as 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Check if iso-wkb variant: iso-wkb adds 1000, 2000 or 3000 to the geometry code
  const isoType = (geometryCode - wkbHeader.geometryType) / 1000;
  switch (isoType) {
    case 0:
      break;
    case 1:
      wkbHeader.type = 'iso-wkb';
      wkbHeader.dimensions = 3;
      wkbHeader.coordinates = 'xyz';
      break;
    case 2:
      wkbHeader.type = 'iso-wkb';
      wkbHeader.dimensions = 3;
      wkbHeader.coordinates = 'xym';
      break;
    case 3:
      wkbHeader.type = 'iso-wkb';
      wkbHeader.dimensions = 4;
      wkbHeader.coordinates = 'xyzm';
      break;
    default:
      throw new Error(`WKB: Unsupported iso-wkb type: ${isoType}`);
  }

  // Check if EWKB variant. Uses bitmasks for Z&M dimensions as well as optional SRID field
  const ewkbZ = geometryCode & EWKB_FLAG_Z;
  const ewkbM = geometryCode & EWKB_FLAG_M;
  const ewkbSRID = geometryCode & EWKB_FLAG_SRID;

  if (ewkbZ && ewkbM) {
    wkbHeader.type = 'ewkb';
    wkbHeader.dimensions = 4;
    wkbHeader.coordinates = 'xyzm';
  } else if (ewkbZ) {
    wkbHeader.type = 'ewkb';
    wkbHeader.dimensions = 3;
    wkbHeader.coordinates = 'xyz';
  } else if (ewkbM) {
    wkbHeader.type = 'ewkb';
    wkbHeader.dimensions = 3;
    wkbHeader.coordinates = 'xym';
  }

  // If SRID present read four more bytes
  if (ewkbSRID) {
    wkbHeader.type = 'ewkb';
    // 4-digit code representing dimension and type of geometry
    wkbHeader.srid = dataView.getUint32(wkbHeader.byteOffset, wkbHeader.littleEndian);
    wkbHeader.byteOffset += 4;
  }

  return wkbHeader;
}
