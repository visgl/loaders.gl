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
 * @param geojson
 * @returns string
 */
export default function encodeWKB(geometry: Geometry | Feature): ArrayBuffer {
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

function encodePoint(point: Point): ArrayBuffer {
  var wkb = new BinaryWriter(this._getWkbSize());

  wkb.writeInt8(1);
  this._writeWkbType(wkb, Types.wkb.Point, parentOptions);

  if (typeof this.x === 'undefined' && typeof this.y === 'undefined') {
      wkb.writeDoubleLE(NaN);
      wkb.writeDoubleLE(NaN);

      if (this.hasZ)
          wkb.writeDoubleLE(NaN);
      if (this.hasM)
          wkb.writeDoubleLE(NaN);
  }
  else {
      this._writeWkbPoint(wkb);
  }

  return wkb.buffer;
};
function getPointSize(point: Point): number {
  var size = 1 + 4 + 8 + 8;

  if (point.hasZ)
      size += 8;
  if (point.hasM)
      size += 8;

  return size;
};

function encodeLineString(lineString: LineString): ArrayBuffer {
  const size = getLineStringSize(lineString)

  var wkb = new BinaryWriter(size);

  wkb.writeInt8(1);

  writeWkbType(wkb, WKB.LineString);
  wkb.writeUInt32LE(this.points.length);

  for (var i = 0; i < this.points.length; i++)
      this.points[i]._writeWkbPoint(wkb);

  return wkb.arrayBuffer;
}

function getLineStringSize(lineString: LineString): number {
  var coordinateSize = 16;

  if (lineString.hasZ)
      coordinateSize += 8;
  if (lineString.hasM)
      coordinateSize += 8;

  return 1 + 4 + 4 + (lineString.points.length * coordinateSize);
}

export function encodeGeometryCollection(geometry: GeometryCollection): ArrayBuffer {
  var writer = new BinaryWriter(this._getWkbSize());

  writer.writeInt8(1);

  writeWkbType(writer, WKB.GeometryCollection);
  wkb.writeUInt32LE(this.geometries.length);

  for (var i = 0; i < this.geometries.length; i++) {
      wkb.writeBuffer(this.geometries[i].toWkb({ srid: this.srid }));
  }

  return wkb.arrayBuffer;
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

  writer.writeUInt32LE((dimensionType + geometryType) >>> 0, true);
};