// loaders.gl, MIT license
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz

import type {
  Feature, 
  Geometry, 
  Point, 
  MultiPoint, 
  LineString, MultiLineString,
  Polygon, 
  MultiPolygon,
  GeometryCollection
} from '@loaders.gl/schema';

import BinaryWriter from './utils/binary-writer';

enum WKB {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7
};

/**
 * Encodes a GeoJSON object into WKB
 * @param geojson A geojson feature or geometry
 * @returns string
 */
export default function encodeWKB(geometry: Geometry | Feature, options?): ArrayBuffer {
  if (geometry.type === 'Feature') {
    geometry = geometry.geometry;
  }

  switch (geometry.type) {
    case 'Point':
      return encodePoint(geometry as Point);
    case 'LineString':
      return encodeLineString(geometry as LineString);
    case 'Polygon':
      return encodePolygon(geometry as Polygon);
    case 'MultiPoint':
      return encodeMultiPoint(geometry as MultiPoint);
    case 'MultiPolygon':
      return encodeMultiPolygon(geometry as MultiPolygon);
    case 'MultiLineString':
      return encodeMultiLineString(geometry as MultiLineString);
    case 'GeometryCollection':
      return encodeGeometryCollection(geometry as GeometryCollection);
    default:
      throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
  }
}

/** Calculate the binary size (in the WKB encoding) of a specific geojson geometry */
function getGeometrySize(geometry: Geometry): number {
  switch (geometry.type) {
    case 'Point':
      return getPointSize(geometry as Point);
    case 'LineString':
      return getLineStringSize(geometry as LineString);
    case 'Polygon':
      return getPolygonSize(geometry as Polygon);
    case 'MultiPoint':
      return getMultiPointSize(geometry as MultiPoint);
    case 'MultiPolygon':
      return getMultiPolygonSize(geometry as MultiPolygon);
    case 'MultiLineString':
      return getMultiLineStringSize(geometry as MultiLineString);
    case 'GeometryCollection':
      return getGeometryCollectionSize(geometry as GeometryCollection);
    default:
      return 0;
  }
}

function encodePoint(point: Point, options?): ArrayBuffer {
  const writer = new BinaryWriter(getPointSize(point));

  writer.writeInt8(1);
  writeWkbType(writer, WKB.Point, options);

  if (typeof point.coordinates[0] === 'undefined' && typeof point.coordinates[0] === 'undefined') {
      writer.writeDoubleLE(NaN);
      writer.writeDoubleLE(NaN);

      if (options.hasZ)
          writer.writeDoubleLE(NaN);
      if (options.hasM)
          writer.writeDoubleLE(NaN);
  }
  else {
    writePoint(writer, point, options);
  }

  return writer.arrayBuffer;
}

function writePoint(writer: BinaryWriter, point: Point, options?): void {
  writer.writeDoubleLE(point.coordinates[0]);
  writer.writeDoubleLE(point.coordinates[1]);

  if (options.hasZ)
      writer.writeDoubleLE(point.coordinates[2]);
  if (options.hasM)
      writer.writeDoubleLE(point.coordinates[3]);
}

function getPointSize(point: Point, options?): number {
  var size = 1 + 4 + 8 + 8;

  if (options.hasZ)
      size += 8;
  if (options.hasM)
      size += 8;

  return size;
};

function encodeLineString(lineString: LineString, options?): ArrayBuffer {
  const size = getLineStringSize(lineString)

  const writer = new BinaryWriter(size);

  writer.writeInt8(1);

  writeWkbType(writer, WKB.LineString);
  writer.writeUInt32LE(lineString.points.length);

  for (var i = 0; i < lineString.points.length; i++)
    writePoint(writer, lineString.points[i], options);

  return writer.arrayBuffer;
}

function getLineStringSize(lineString: LineString, options?): number {
  var coordinateSize = 16;

  if (options.hasZ)
      coordinateSize += 8;
  if (options.hasM)
      coordinateSize += 8;

  return 1 + 4 + 4 + (lineString.points.length * coordinateSize);
}

function encodePolygon(polygon: Polygon, options?) {
  const writer = new BinaryWriter(getPolygonSize(polygon));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.Polygon, options);

  if (polygon.exteriorRing.length > 0) {
      writer.writeUInt32LE(1 + this.interiorRings.length);
      writer.writeUInt32LE(this.exteriorRing.length);
  }
  else {
      writer.writeUInt32LE(0);
  }

  for (var i = 0; i < polygon.exteriorRing.length; i++)
      writePoint(writer, polygon.exteriorRing[i], options);

  for (i = 0; i < polygon.interiorRings.length; i++) {
      writer.writeUInt32LE(polygon.interiorRings[i].length);

      for (var j = 0; j < polygon.interiorRings[i].length; j++)
          writePoint(writer, polygon.interiorRings[i][j], options);
  }

  return writer.arrayBuffer;
}

function getPolygonSize(polygon: Polygon, options?): number {
  var coordinateSize = 16;

  if (options.hasZ)
      coordinateSize += 8;
  if (options.hasM)
      coordinateSize += 8;

  var size = 1 + 4 + 4;

  if (polygon.coordinates.length > 0) {
    size += 4 + (polygon.coordinates.length * coordinateSize);
  }

  for (var i = 0; i < polygon.interiorRings.length; i++)
      size += 4 + (polygon.interiorRings[i].length * coordinateSize);

  return size;
};

function encodeMultiPoint(multiPoint: MultiPoint, options?) {
  const writer = new BinaryWriter(getMultiPointSize(multiPoint));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiPoint);
  writer.writeUInt32LE(multiPoint.points.length);

  for (var i = 0; i < multiPoint.points.length; i++) {
    const arrayBuffer = encodePoint(multiPoint.points[i], { srid: multiPoint.srid });
    writer.writeBuffer(arrayBuffer);
  }

  return writer.arrayBuffer;
}

function getMultiPointSize(multiPoint: MultiPoint, options?) {
  var coordinateSize = 16;

  if (options.hasZ)
      coordinateSize += 8;
  if (options.hasM)
      coordinateSize += 8;

  coordinateSize += 5;

  return 1 + 4 + 4 + (multiPoint.points.length * coordinateSize);
}

function encodeMultiLineString(multiLineString: MultiLineString, options?) {
  const writer = new BinaryWriter(getMultiLineStringSize(multiLineString));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiLineString);
  writer.writeUInt32LE(multiLineString.lineStrings.length);

  for (var i = 0; i < multiLineString.lineStrings.length; i++)
      writer.writeBuffer(multiLineString.lineStrings[i].toWkb({ srid: this.srid }));

  return writer.arrayBuffer;
}

function getMultiLineStringSize(multiLineString: MultiLineString, options?): number {
  var size = 1 + 4 + 4;

  for (var i = 0; i < multiLineString.lineStrings.length; i++)
      size += multiLineString.lineStrings[i]._getWkbSize();

  return size;
}

function encodeMultiPolygon(multiPolygon: MultiPolygon): ArrayBuffer {
  const writer = new BinaryWriter(getMultiPolygonSize(multiPolygon));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.MultiPolygon);
  writer.writeUInt32LE(multiPolygon.polygons.length);

  for (var i = 0; i < multiPolygon.polygons.length; i++)
      writer.writeBuffer(multiPolygon.polygons[i], { srid: this.srid });

  return writer.arrayBuffer;
};

function getMultiPolygonSize(multiPolygon: MultiPolygon): number {
  var size = 1 + 4 + 4;

  for (var i = 0; i < multiPolygon.polygons.length; i++)
      size += multiPolygon.polygons[i]._getWkbSize();

  return size;
};

function encodeGeometryCollection(collection: GeometryCollection, options?): ArrayBuffer {
  var writer = new BinaryWriter(getGeometryCollectionSize(collection));

  writer.writeInt8(1);

  writeWkbType(writer, WKB.GeometryCollection);
  writer.writeUInt32LE(collection.geometries.length);

  for (const geometry of collection.geometries) {
    const arrayBuffer = encodeWKB(geometry, { srid: collection.srid });
    writer.writeBuffer(arrayBuffer);
  }

  return writer.arrayBuffer;
}

function getGeometryCollectionSize(collection: GeometryCollection): number {
  let size = 1 + 4 + 4;

  for (const geometry of collection.geometries) {
    size += getGeometrySize(geometry);
  }

  return size;
}

// HELPERS

function writeWkbType(writer: BinaryWriter, geometryType: number, options?) {
  var dimensionType = 0;

  /*
  if (typeof this.srid === 'undefined' && (!options? || typeof options?.srid === 'undefined')) {
      if (this.hasZ && this.hasM)
          dimensionType += 3000;
      else if (this.hasZ)
          dimensionType += 1000;
      else if (this.hasM)
          dimensionType += 2000;
  }
  else {
      if (this.hasZ)
          dimensionType |= 0x80000000;
      if (this.hasM)
          dimensionType |= 0x40000000;
  }
  */

  writer.writeUInt32LE((dimensionType + geometryType) >>> 0);
}
