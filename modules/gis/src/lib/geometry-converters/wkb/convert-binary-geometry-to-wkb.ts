// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz
// Reference: https://www.ogc.org/standards/sfa

// import {TypedArray} from '@math.gl/types';
// import type {
//   BinaryGeometry,
//   BinaryPointGeometry,
//   BinaryLineGeometry,
//   BinaryPolygonGeometry
// } from '@loaders.gl/schema';
// import {WKBGeometryType, WKBOptions} from './helpers/wkb-types';
// import {writeWkbHeader} from './helpers/write-wkb-header';
// import {
//   matchWKBOptionsToPointSize,
//   getCoordinateByteSize,
//   getWKBTypeFromGeometryType
// } from './helpers/wkb-utils';
// import {BinaryWriter} from '../../utils/binary-writer';
// import {
//   BinaryGeometryInfo,
//   getBinaryGeometryInfo
// } from '../../binary-geometry-api/binary-geometry-utils';

// /**
//  * Encodes a GeoJSON object into WKB
//  * @param geojson A GeoJSON Feature or Geometry
//  * @returns string
//  */
// export function convertBinaryGeometryToWKB(
//   geometry: BinaryGeometry,
//   options?: WKBOptions
// ): ArrayBuffer {
//   const info = getBinaryGeometryInfo(geometry);
//   const wkbOptions = matchWKBOptionsToPointSize(info.dimension, options);
//   const byteLength = getBinaryGeometryByteLength(geometry, info, wkbOptions);
//   const writer = new BinaryWriter(byteLength);

//   switch (geometry.type) {
//     case 'Point':
//       info.isMultiGeometry
//         ? encodePoint(writer, geometry, info, wkbOptions)
//         : encodeMultiPoint(writer, geometry, info, wkbOptions);
//       break;
//     case 'LineString':
//       info.isMultiGeometry
//         ? encodeLineString(writer, geometry, info, wkbOptions)
//         : encodeMultiLineString(writer, geometry, info, wkbOptions);
//       break;
//     case 'Polygon':
//       info.isMultiGeometry
//         ? encodePolygon(writer, geometry, info, wkbOptions)
//         : encodeMultiPolygon(writer, geometry, info, wkbOptions);
//       break;
//     default:
//       // @ts-expect-error
//       throw new Error(`Invalid flat geometry: ${geometry.type}`);
//   }

//   return writer.arrayBuffer;
// }

// /** Calculate the binary size (in the WKB encoding) of a specific GeoJSON geometry */
// function getBinaryGeometryByteLength(
//   geometry: BinaryGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): number {
//   switch (geometry.type) {
//     case 'Point':
//       return info.isMultiGeometry
//         ? getMultiPointByteLength(geometry, info, options)
//         : getPointByteLength(info, options);
//     case 'LineString':
//       return info.isMultiGeometry
//         ? getLineStringByteLength(geometry, info, options)
//         : getMultiLineStringByteLength(geometry, info, options);
//     case 'Polygon':
//       return info.isMultiGeometry
//         ? getPolygonByteLength(geometry, info, options)
//         : getMultiPolygonByteLength(geometry, info, options);
//     default:
//       // @ts-expect-error
//       throw new Error(`Invalid flat geometry: ${geometry.type}`);
//   }
// }

// /** Write coordinate to buffer */
// function writeCoordinate(
//   writer: BinaryWriter,
//   positions: TypedArray,
//   index: number,
//   options: WKBOptions
// ): void {
//   writer.writeDoubleLE(positions[index + 0]);
//   writer.writeDoubleLE(positions[index + 1]);

//   if (options?.hasZ) {
//     writer.writeDoubleLE(positions[index + 2]);
//   }
//   if (options?.hasM) {
//     writer.writeDoubleLE(positions[index + 3]);
//   }
// }

// /** Get encoded size of Point geometry */
// function getPointByteLength(info: BinaryGeometryInfo, options: WKBOptions): number {
//   const coordinateSize = getCoordinateByteSize(options);
//   // type + count + coordinates
//   return 1 + 4 + coordinateSize * info.dimension;
// }

// /** Encode Point geometry as WKB ArrayBuffer */
// function encodePoint(
//   writer: BinaryWriter,
//   point: BinaryPointGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): void {
//   if (info.isMultiGeometry) {
//     return encodeMultiPoint(writer, point, info, options);
//   }

//   const wkbGeometryType = getWKBTypeFromGeometryType(info.multiGeometryType);
//   writeWkbHeader(writer, wkbGeometryType, options);

//   const coordinates = point.positions.value;

//   // This special case is to handle writing empty geometry Points (NaN, NaN) correctly
//   // Other types express empty geometry by writing a zero length.
//   if (typeof coordinates[0] === 'undefined' && typeof coordinates[1] === 'undefined') {
//     writer.writeDoubleLE(NaN);
//     writer.writeDoubleLE(NaN);

//     if (options?.hasZ) {
//       writer.writeDoubleLE(NaN);
//     }
//     if (options?.hasM) {
//       writer.writeDoubleLE(NaN);
//     }
//   } else {
//     writeCoordinate(writer, coordinates, 0, options);
//   }
// }

// /** Get encoded size of MultiPoint geometry */
// function getMultiPointByteLength(
//   multiPoint: BinaryPointGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ) {
//   // let coordinateSize = getCoordinateByteSize(options);

//   // // This is because each point has a 5-byte header
//   // coordinateSize += 5;

//   return 1 + 4 + 4 + info.coordinateCount * getPointByteLength(info, options);
// }

// /** Encode MultiPoint geometry as WKB ArrayBufer */
// function encodeMultiPoint(
//   writer: BinaryWriter,
//   multiPoint: BinaryPointGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): void {
//   const points = multiPoint.positions.value;

//   writeWkbHeader(writer, WKBGeometryType.MultiPoint, options);
//   writer.writeUInt32LE(points.length);

//   for (const point of points) {
//     // TODO: This is very inefficient - let's write into offset
//     // TODO: add srid to this options object? {srid: multiPoint.srid}
//     encodePoint(writer, point, info, options);
//   }
// }

// /** Get encoded size of LineString geometry */
// function getLineStringByteLength(
//   geometry: BinaryLineGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): number {
//   const coordinateSize = getCoordinateByteSize(options);
//   return 1 + 4 + 4 + geometry.positions.value.length * coordinateSize;
// }

// /** Get encoded size of MultiLineString geometry */
// function getMultiLineStringByteLength(
//   multiLineString: BinaryLineGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): number {
//   let size = 1 + 4 + 4;
//   const lineStrings = multiLineString.coordinates;

//   for (const lineString of lineStrings) {
//     size += getLineStringByteLength(lineString, options);
//   }

//   return size;
// }

// /** Encode LineString geometry as WKB ArrayBuffer */
// function encodeLineString(
//   writer: BinaryWriter,
//   line: BinaryLineGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): void {
//   // const byteLength = getLineStringByteLength(line, options);
//   // const writer = new BinaryWriter(byteLength);

//   writeWkbHeader(writer, WKBGeometryType.LineString, options);
//   writer.writeUInt32LE(positions.value.length);

//   writer.writeTypedArray(positions.value);
// }

// /** Encode MultiLineString geometry as WKB ArrayBufer */
// function encodeMultiLineString(
//   writer: BinaryWriter,
//   multiLineString: MultiLineString,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ) {
//   const lineStrings = multiLineString.coordinates;

//   writeWkbHeader(writer, WKBGeometryType.MultiLineString, options);
//   writer.writeUInt32LE(lineStrings.length);

//   for (const lineString of lineStrings) {
//     // TODO: Handle srid?
//     encodeLineString(writer, lineString, info, options);
//   }
// }

// /** Get encoded size of Polygon geometry */
// function getPolygonByteLength(
//   geometry: BinaryPolygonGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): number {
//   const coordinateSize = getCoordinateByteSize(options);
//   const [exteriorRing = [], ...interiorRings] = geometry.polygonIndices;

//   let size = 1 + 4 + 4;

//   if (exteriorRing.length > 0) {
//     size += 4 + exteriorRing.length * coordinateSize;
//   }

//   for (const interiorRing of interiorRings) {
//     size += 4 + interiorRing.length * coordinateSize;
//   }

//   return size;
// }

// /** Encode Polygon geometry as WKB ArrayBuffer */
// function encodePolygon(
//   writer: BinaryWriter,
//   coordinates: BinaryPolygonGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): void {
//   writeWkbHeader(writer, WKBGeometryType.Polygon, options);

//   const [exteriorRing = [], ...interiorRings] = coordinates;

//   if (exteriorRing.length > 0) {
//     writer.writeUInt32LE(1 + interiorRings.length);
//     writer.writeUInt32LE(exteriorRing.length);
//   } else {
//     writer.writeUInt32LE(0);
//   }

//   for (const coordinate of exteriorRing) {
//     writeCoordinate(writer, coordinate, options);
//   }

//   for (const interiorRing of interiorRings) {
//     writer.writeUInt32LE(interiorRing.length);

//     for (const coordinate of interiorRing) {
//       writeCoordinate(writer, coordinate, options);
//     }
//   }
// }

// function getMultiPolygonByteLength(
//   multiPolygon: MultiPolygon,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): number {
//   let size = 1 + 4 + 4;
//   const polygons = multiPolygon.coordinates;

//   for (const polygon of polygons) {
//     size += getPolygonByteLength(polygon, info, options);
//   }

//   return size;
// }

// function encodeMultiPolygon(
//   writer: BinaryWriter,
//   multiPolygon: BinaryPolygonGeometry,
//   info: BinaryGeometryInfo,
//   options: WKBOptions
// ): void {
//   const polygons = multiPolygon.coordinates;

//   writeWkbHeader(writer, WKBGeometryType.MultiPolygon, options);
//   writer.writeUInt32LE(polygons.length);

//   for (const polygon of polygons) {
//     encodePolygon(writer, polygon, info, options);
//   }
// }

// // function encodeGeometryCollection(
// //   collection: GeometryCollection,
// //   options: WKBOptions
// // ): ArrayBuffer {
// //   const writer = new BinaryWriter(getGeometryCollectionSize(collection, options));

// //   writeWkbHeader(writer, WKBGeometryType.GeometryCollection, options);
// //   writer.writeUInt32LE(collection.geometries.length);

// //   for (const geometry of collection.geometries) {
// //     // TODO: handle srid? {srid: collection.srid}
// //     const arrayBuffer = convertGeometryToWKB(geometry, options);
// //     writer.writeBuffer(arrayBuffer);
// //   }

// //   return writer.arrayBuffer;
// // }

// // function getGeometryCollectionSize(collection: GeometryCollection, options: WKBOptions): number {
// //   let size = 1 + 4 + 4;

// //   for (const geometry of collection.geometries) {
// //     size += getGeometrySize(geometry, options);
// //   }

// //   return size;
// // }
