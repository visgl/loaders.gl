// loaders.gl, MIT license
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz
// Reference: https://www.ogc.org/standards/sfa

import type {
  Feature,
  Geometry,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection
} from '@loaders.gl/schema';

import {BinaryWriter} from './utils/binary-writer';

/**
 * Integer code for geometry type
 * Reference: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 */
enum WKB {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7
}

/**
 * Options for encodeWKB
 */
interface WKBOptions {
  /** Does the GeoJSON input have Z values? */
  hasZ?: boolean;

  /** Does the GeoJSON input have M values? */
  hasM?: boolean;

  /** Spatial reference for input GeoJSON */
  srid?: any;
}

/**
 * Encodes a GeoJSON object into WKB
 * @param geojson A GeoJSON Feature or Geometry
 * @returns string
 */
export function encodeWKB(
  geometry: Geometry | Feature,
  options: WKBOptions | {wkb: WKBOptions} = {}
): ArrayBuffer {
  if (geometry.type === 'Feature') {
    geometry = geometry.geometry;
  }

  // Options should be wrapped in a `wkb` key, but we allow top-level options here for backwards
  // compatibility
  if ('wkb' in options) {
    options = options.wkb;
  }

  switch (geometry.type) {
    case 'Point':
      return encodePoint(geometry.coordinates, options);
    case 'LineString':
      return encodeLineString(geometry.coordinates, options);
    case 'Polygon':
      return encodePolygon(geometry.coordinates, options);
    case 'MultiPoint':
      return encodeMultiPoint(geometry, options);
    case 'MultiPolygon':
      return encodeMultiPolygon(geometry, options);
    case 'MultiLineString':
      return encodeMultiLineString(geometry, options);
    case 'GeometryCollection':
      return encodeGeometryCollection(geometry, options);
    default:
      const exhaustiveCheck: never = geometry;
      throw new Error(`Unhandled case: ${exhaustiveCheck}`);
  }
}

/** Calculate the binary size (in the WKB encoding) of a specific GeoJSON geometry */
function getGeometrySize(geometry: Geometry, options: WKBOptions): number {
  switch (geometry.type) {
    case 'Point':
      return getPointSize(options);
    case 'LineString':
      return getLineStringSize(geometry.coordinates, options);
    case 'Polygon':
      return getPolygonSize(geometry.coordinates, options);
    case 'MultiPoint':
      return getMultiPointSize(geometry, options);
    case 'MultiPolygon':
      return getMultiPolygonSize(geometry, options);
    case 'MultiLineString':
      return getMultiLineStringSize(geometry, options);
    case 'GeometryCollection':
      return getGeometryCollectionSize(geometry, options);
    default:
      const exhaustiveCheck: never = geometry;
      throw new Error(`Unhandled case: ${exhaustiveCheck}`);
  }
}

/** Encode Point geometry as WKB ArrayBuffer */
function encodePoint(coordinates: Point['coordinates'], options: WKBOptions): ArrayBuffer {
  const writer = new BinaryWriter(getPointSize(options));

  writer.writeInt8(1);
  writeWkbType(writer, WKB.Point, options);

  // I believe this special case is to handle writing Point(NaN, NaN) correctly
  if (typeof coordinates[0] === 'undefined' && typeof coordinates[1] === 'undefined') {
    writer.writeDoubleLE(NaN);
    writer.writeDoubleLE(NaN);

    if (options.hasZ) {
      writer.writeDoubleLE(NaN);
    }
    if (options.hasM) {
      writer.writeDoubleLE(NaN);
    }
  } else {
    writeCoordinate(writer, coordinates, options);
  }

  return writer.arrayBuffer;
}

/** Write coordinate to buffer */
function writeCoordinate(
  writer: BinaryWriter,
  coordinate: Point['coordinates'],
  options: WKBOptions
): void {
  writer.writeDoubleLE(coordinate[0]);
  writer.writeDoubleLE(coordinate[1]);

  if (options.hasZ) {
    writer.writeDoubleLE(coordinate[2]);
  }
  if (options.hasM) {
    writer.writeDoubleLE(coordinate[3]);
  }
}

/** Get encoded size of Point geometry */
function getPointSize(options: WKBOptions): number {
  const coordinateSize = getCoordinateSize(options);
  return 1 + 4 + coordinateSize;
}

/** Encode LineString geometry as WKB ArrayBuffer */
function encodeLineString(
  coordinates: LineString['coordinates'],
  options: WKBOptions
): ArrayBuffer {
  const size = getLineStringSize(coordinates, options);

  const writer = new BinaryWriter(size);

  writer.writeInt8(1);

  writeWkbType(writer, WKB.LineString, options);
  writer.writeUInt32LE(coordinates.length);

  for (const coordinate of coordinates) {
    writeCoordinate(writer, coordinate, options);
  }

  return writer.arrayBuffer;
}

/** Get encoded size of LineString geometry */
function getLineStringSize(coordinates: LineString['coordinates'], options: WKBOptions): number {
  const coordinateSize = getCoordinateSize(options);

  return 1 + 4 + 4 + coordinates.length * coordinateSize;
}

/** Encode Polygon geometry as WKB ArrayBuffer */
function encodePolygon(coordinates: Polygon['coordinates'], options: WKBOptions): ArrayBuffer {
  const writer = new BinaryWriter(getPolygonSize(coordinates, options));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.Polygon, options);
  const [exteriorRing, ...interiorRings] = coordinates;

  if (exteriorRing.length > 0) {
    writer.writeUInt32LE(1 + interiorRings.length);
    writer.writeUInt32LE(exteriorRing.length);
  } else {
    writer.writeUInt32LE(0);
  }

  for (const coordinate of exteriorRing) {
    writeCoordinate(writer, coordinate, options);
  }

  for (const interiorRing of interiorRings) {
    writer.writeUInt32LE(interiorRing.length);

    for (const coordinate of interiorRing) {
      writeCoordinate(writer, coordinate, options);
    }
  }

  return writer.arrayBuffer;
}

/** Get encoded size of Polygon geometry */
function getPolygonSize(coordinates: Polygon['coordinates'], options: WKBOptions): number {
  const coordinateSize = getCoordinateSize(options);
  const [exteriorRing, ...interiorRings] = coordinates;

  let size = 1 + 4 + 4;

  if (exteriorRing.length > 0) {
    size += 4 + exteriorRing.length * coordinateSize;
  }

  for (const interiorRing of interiorRings) {
    size += 4 + interiorRing.length * coordinateSize;
  }

  return size;
}

/** Encode MultiPoint geometry as WKB ArrayBufer */
function encodeMultiPoint(multiPoint: MultiPoint, options: WKBOptions) {
  const writer = new BinaryWriter(getMultiPointSize(multiPoint, options));
  const points = multiPoint.coordinates;

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiPoint, options);
  writer.writeUInt32LE(points.length);

  for (const point of points) {
    // TODO: add srid to this options object? {srid: multiPoint.srid}
    const arrayBuffer = encodePoint(point, options);
    writer.writeBuffer(arrayBuffer);
  }

  return writer.arrayBuffer;
}

/** Get encoded size of MultiPoint geometry */
function getMultiPointSize(multiPoint: MultiPoint, options: WKBOptions) {
  let coordinateSize = getCoordinateSize(options);
  const points = multiPoint.coordinates;

  // This is because each point has a 5-byte header?
  coordinateSize += 5;

  return 1 + 4 + 4 + points.length * coordinateSize;
}

/** Encode MultiLineString geometry as WKB ArrayBufer */
function encodeMultiLineString(multiLineString: MultiLineString, options: WKBOptions) {
  const writer = new BinaryWriter(getMultiLineStringSize(multiLineString, options));
  const lineStrings = multiLineString.coordinates;

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiLineString, options);
  writer.writeUInt32LE(lineStrings.length);

  for (const lineString of lineStrings) {
    // TODO: Handle srid?
    const encodedLineString = encodeLineString(lineString, options);
    writer.writeBuffer(encodedLineString);
  }

  return writer.arrayBuffer;
}

/** Get encoded size of MultiLineString geometry */
function getMultiLineStringSize(multiLineString: MultiLineString, options: WKBOptions): number {
  let size = 1 + 4 + 4;
  const lineStrings = multiLineString.coordinates;

  for (const lineString of lineStrings) {
    size += getLineStringSize(lineString, options);
  }

  return size;
}

function encodeMultiPolygon(multiPolygon: MultiPolygon, options: WKBOptions): ArrayBuffer {
  const writer = new BinaryWriter(getMultiPolygonSize(multiPolygon, options));
  const polygons = multiPolygon.coordinates;

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiPolygon, options);
  writer.writeUInt32LE(polygons.length);

  for (const polygon of polygons) {
    const encodedPolygon = encodePolygon(polygon, options);
    writer.writeBuffer(encodedPolygon);
  }

  return writer.arrayBuffer;
}

function getMultiPolygonSize(multiPolygon: MultiPolygon, options: WKBOptions): number {
  let size = 1 + 4 + 4;
  const polygons = multiPolygon.coordinates;

  for (const polygon of polygons) {
    size += getPolygonSize(polygon, options);
  }

  return size;
}

function encodeGeometryCollection(
  collection: GeometryCollection,
  options: WKBOptions
): ArrayBuffer {
  const writer = new BinaryWriter(getGeometryCollectionSize(collection, options));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.GeometryCollection, options);
  writer.writeUInt32LE(collection.geometries.length);

  for (const geometry of collection.geometries) {
    // TODO: handle srid? {srid: collection.srid}
    const arrayBuffer = encodeWKB(geometry, options);
    writer.writeBuffer(arrayBuffer);
  }

  return writer.arrayBuffer;
}

function getGeometryCollectionSize(collection: GeometryCollection, options: WKBOptions): number {
  let size = 1 + 4 + 4;

  for (const geometry of collection.geometries) {
    size += getGeometrySize(geometry, options);
  }

  return size;
}

// HELPERS

/**
 * Construct and write WKB integer code
 * Reference: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 */
function writeWkbType(writer: BinaryWriter, geometryType: number, options: WKBOptions): void {
  const {hasZ, hasM, srid} = options;

  let dimensionType = 0;

  if (!srid) {
    if (hasZ && hasM) {
      dimensionType += 3000;
    } else if (hasZ) {
      dimensionType += 1000;
    } else if (hasM) {
      dimensionType += 2000;
    }
  } else {
    if (hasZ) {
      dimensionType |= 0x80000000;
    }
    if (hasM) {
      dimensionType |= 0x40000000;
    }
  }

  writer.writeUInt32LE((dimensionType + geometryType) >>> 0);
}

/** Get coordinate size given Z/M dimensions */
function getCoordinateSize(options: WKBOptions): number {
  let coordinateSize = 16;

  if (options.hasZ) {
    coordinateSize += 8;
  }
  if (options.hasM) {
    coordinateSize += 8;
  }

  return coordinateSize;
}
