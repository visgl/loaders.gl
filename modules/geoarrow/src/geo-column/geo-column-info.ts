// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {GeoColumn} from './geo-column';
// import {getGeoParquetMetadata, GeoParquetMetadata} from '../metadata/geoparquet-metadata';
// import {getGeoArrowMetadata, GeoArrowMetadata} from '../metadata_3/geoarrow-metadata';

/**
 * Information about a binary geometry
 */
export type geoColumnInfo = {
  type: 'Point' | 'LineString' | 'Polygon';
  /** The GeoJSON style geometry type corresponding to this particular binary geometry */
  multiGeometryType:
    | 'Point'
    | 'LineString'
    | 'Polygon'
    | 'MultiPoint'
    | 'MultiLineString'
    | 'MultiPolygon';
  /** Is this a "Multi" version of the binary geometry? */
  isMultiGeometry: boolean;
  /** How many dimensions are the coordinates? */
  dimension: number;
  /** How many points does this geometry have? */
  pointCount: number;
  /** How many coordinates does this geometry have? */
  coordinateCount: number;
};

/**
 * @returns information about a binary geometry
 */
// export function getGeoColumnInfo(geometry: GeoColumn): GeoColumnInfo {

// }

// // loaders.gl
// // SPDX-License-Identifier: MIT
// // Copyright (c) vis.gl contributors

// import type {Schema, Field, GeoArrowMetadata, GeoArrowEncoding, Geometry} from '@loaders.gl/schema';
// import {convertArrowToSchema} from '@loaders.gl/schema-utils';
// import * as arrow from 'apache-arrow';
// import {getGeometryColumnsFromSchemaMetadata, getGeometryMetadataForField} from '../geoarrow/geoarrow-metadata';
// import { getGeoMetadata as getParquetMe} from './geoparquet-metadata';

// /**
// * A geoarrow / geoparquet geo metadata object
// * (stored in stringified form in the top level metadata 'geo' key)
// * @see https://github.com/opengeospatial/geoparquet/blob/main/format-specs/geoparquet.md
// * @see https://github.com/geoarrow/geoarrow
// * */
// export type GeoTableMetadata = {
//  version?: string;
//  primaryGeometryColumn?: string;
//  columns: Record<string, GeoColumnInfo>;
//  [key: string]: unknown;
// };

// /** A geoarrow / geoparquet geo metadata for one geometry column  */
// export type GeoColumnInfo = {
//  encoding: 'wkb' | 'wkt' | 'none';
//  geometryTypes: Geometry['type'][];
//  dimension: number;
//  crs?: object | null;
//  orientation?: 'counterclockwise';
//  bbox?: [number, number, number, number] | [number, number, number, number, number, number];
//  edges?: 'planar' | 'spherical';
//  epoch?: number;

//  [key: string]: unknown;
//  // geoParquetGeometryType:
// };

// export type GeoArrowInfo = {
//   geometryColumns: Record<string, GeometryColumnInfo>
// };

// /**
//  * get geometry columns from arrow table
//  */
// export function getGeoArrowInfo(arrowTable: arrow.Table): GeoArrowInfo {
//  const schema = convertArrowToSchema(arrowTable.schema);
//   const geometryColumns = getGeometryColumnsFromSchemaMetadata(schema);

//   // get encoding from geometryColumns['geometry']
//   const encoding = geometryColumns.geometry.encoding;

//   // Remove geometry columns
//   const propertyColumnNames = arrowTable.schema.fields
//     .map((field) => field.name)
//     // TODO - this deletes all geometry columns
//     .filter((name) => name in geometryColumns);
//   const propertiesTable = arrowTable.select(propertyColumnNames);

//   const arrowGeometryColumn = arrowTable.getChild('geometry');

//   for (let row = 0; row < arrowTable.numRows; row++) {
//     // get the geometry value from arrow geometry column
//     // Note that type can vary
//     const arrowGeometry = arrowGeometryColumn?.get(row);
//     // parse arrow geometry to geojson feature
//     const feature = convertGeoArrowGeometryToGeoJSON(arrowGeometry, encoding);
//     if (feature) {
//       const properties = propertiesTable.get(row)?.toJSON() || {};
//       features.push({type: 'Feature', geometry: feature, properties});
//     }
//   }

//   return {
//   };
// }
