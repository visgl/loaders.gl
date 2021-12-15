// loaders.gl, MIT license
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz

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

import BinaryWriter from './utils/binary-writer';

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
  hasZ: boolean;
  hasM: boolean;
  srid?: any;
}

/**
 * Encodes a GeoJSON object into WKB
 * @param geojson A GeoJSON Feature or Geometry
 * @returns string
 */
export default function encodeWKB(
  geometry: Geometry | Feature,
  options: WKBOptions = {hasZ: false, hasM: false}
): ArrayBuffer {
  if (geometry.type === 'Feature') {
    geometry = geometry.geometry;
  }

  switch (geometry.type) {
    case 'Point':
      return encodePoint(geometry, options);
    case 'LineString':
      return encodeLineString(geometry, options);
    case 'Polygon':
      return encodePolygon(geometry, options);
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

/** Calculate the binary size (in the WKB encoding) of a specific geojson geometry */
function getGeometrySize(geometry: Geometry, options: WKBOptions): number {
  switch (geometry.type) {
    case 'Point':
      return getPointSize(options);
    case 'LineString':
      return getLineStringSize(geometry, options);
    case 'Polygon':
      return getPolygonSize(geometry, options);
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
function encodePoint(point: Point, options: WKBOptions): ArrayBuffer {
  const writer = new BinaryWriter(getPointSize(options));

  writer.writeInt8(1);
  writeWkbType(writer, WKB.Point, options);

  // I believe this special case is to handle writing Point(NaN, NaN) correctly
  if (typeof point.coordinates[0] === 'undefined' && typeof point.coordinates[1] === 'undefined') {
    writer.writeDoubleLE(NaN);
    writer.writeDoubleLE(NaN);

    if (options.hasZ) {
      writer.writeDoubleLE(NaN);
    }
    if (options.hasM) {
      writer.writeDoubleLE(NaN);
    }
  } else {
    writeCoordinate(writer, point.coordinates, options);
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

/** Get encoded size of Point object */
function getPointSize(options: WKBOptions): number {
  const coordinateSize = getCoordinateSize(options);
  return 1 + 4 + coordinateSize;
}

/** Encode LineString geometry as WKB ArrayBuffer */
function encodeLineString(lineString: LineString, options: WKBOptions): ArrayBuffer {
  const size = getLineStringSize(lineString, options);

  const writer = new BinaryWriter(size);

  writer.writeInt8(1);

  writeWkbType(writer, WKB.LineString, options);
  writer.writeUInt32LE(lineString.coordinates.length);

  for (let i = 0; i < lineString.coordinates.length; i++) {
    writeCoordinate(writer, lineString.coordinates[i], options);
  }

  return writer.arrayBuffer;
}

/** Get encoded size of LineString object */
function getLineStringSize(lineString: LineString, options: WKBOptions): number {
  const coordinateSize = getCoordinateSize(options);

  return 1 + 4 + 4 + lineString.coordinates.length * coordinateSize;
}

/** Encode Polygon geometry as WKB ArrayBuffer */
function encodePolygon(polygon: Polygon, options: WKBOptions): ArrayBuffer {
  const writer = new BinaryWriter(getPolygonSize(polygon, options));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.Polygon, options);
  const [exteriorRing, ...interiorRings] = polygon.coordinates;

  if (exteriorRing.length > 0) {
    writer.writeUInt32LE(1 + interiorRings.length);
    writer.writeUInt32LE(exteriorRing.length);
  } else {
    writer.writeUInt32LE(0);
  }

  for (let i = 0; i < exteriorRing.length; i++) {
    writeCoordinate(writer, exteriorRing[i], options);
  }

  for (let i = 0; i < interiorRings.length; i++) {
    writer.writeUInt32LE(interiorRings[i].length);

    for (let j = 0; j < interiorRings[i].length; j++)
      writeCoordinate(writer, interiorRings[i][j], options);
  }

  return writer.arrayBuffer;
}

/** Get encoded size of Polygon object */
function getPolygonSize(polygon: Polygon, options: WKBOptions): number {
  const coordinateSize = getCoordinateSize(options);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, ...interiorRings] = polygon.coordinates;

  let totalSize = 1 + 4 + 4;

  if (polygon.coordinates.length > 0) {
    totalSize += 4 + polygon.coordinates.length * coordinateSize;
  }

  for (let i = 0; i < interiorRings.length; i++) {
    totalSize += 4 + interiorRings[i].length * coordinateSize;
  }

  return totalSize;
}

function encodeMultiPoint(multiPoint: MultiPoint, options: WKBOptions) {
  const writer = new BinaryWriter(getMultiPointSize(multiPoint, options));
  const points = multiPoint.coordinates;

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiPoint, options);
  writer.writeUInt32LE(points.length);

  for (let i = 0; i < points.length; i++) {
    const arrayBuffer = encodePoint(points[i], {srid: multiPoint.srid});
    writer.writeBuffer(arrayBuffer);
  }

  return writer.arrayBuffer;
}

function getMultiPointSize(multiPoint: MultiPoint, options: WKBOptions) {
  let coordinateSize = getCoordinateSize(options);
  const points = multiPoint.coordinates;

  // This is because each point has a 5-byte header?
  coordinateSize += 5;

  return 1 + 4 + 4 + points.length * coordinateSize;
}

function encodeMultiLineString(multiLineString: MultiLineString, options: WKBOptions) {
  const writer = new BinaryWriter(getMultiLineStringSize(multiLineString, options));
  const lineStrings = multiLineString.coordinates;

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiLineString, options);
  writer.writeUInt32LE(lineStrings.length);

  for (let i = 0; i < lineStrings.length; i++) {
    writer.writeBuffer(lineStrings[i].toWkb({srid: this.srid}));
  }

  return writer.arrayBuffer;
}

function getMultiLineStringSize(multiLineString: MultiLineString, options: WKBOptions): number {
  let size = 1 + 4 + 4;
  const lineStrings = multiLineString.coordinates;

  for (let i = 0; i < lineStrings.length; i++) {
    size += lineStrings[i]._getWkbSize();
  }

  return size;
}

function encodeMultiPolygon(multiPolygon: MultiPolygon, options: WKBOptions): ArrayBuffer {
  const writer = new BinaryWriter(getMultiPolygonSize(multiPolygon));
  const polygons = multiPolygon.coordinates

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiPolygon, options);
  writer.writeUInt32LE(polygons.length);

  for (let i = 0; i < polygons.length; i++) {
    writer.writeBuffer(polygons[i], {srid: this.srid});
  }

  return writer.arrayBuffer;
}

function getMultiPolygonSize(multiPolygon: MultiPolygon): number {
  let size = 1 + 4 + 4;
  const polygons = multiPolygon.coordinates

  for (let i = 0; i < polygons.length; i++) {
    size += polygons[i]._getWkbSize();
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
    const arrayBuffer = encodeWKB(geometry, {srid: collection.srid});
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
