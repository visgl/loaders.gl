// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Proj4Projection} from '@math.gl/proj4';
import {convertGeometryToWKB, transformGeoJsonCoords} from '@loaders.gl/gis';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';

import type {ArrowTable, ArrowTableBatch, Feature, Field, GeoJSONTable, Schema, Table} from '@loaders.gl/schema';

import {fgbToBinaryGeometry} from './binary-geometries';
import {getSchemaFromFGBHeader} from './get-schema-from-fgb-header';

import * as fgb from '../flatgeobuf/3.27.2';
import * as geojson from '../flatgeobuf/3.27.2/geojson';
import * as generic from '../flatgeobuf/3.27.2/generic';
import {parseProperties as parsePropertiesBinary} from '../flatgeobuf/3.27.2/generic/feature';
import {ColumnType} from '../flatgeobuf/3.27.2/flat-geobuf/column-type';
import {GeometryType} from '../flatgeobuf/3.27.2/flat-geobuf/geometry-type';

const deserializeGeoJson = geojson.deserialize;
const deserializeGeneric = generic.deserialize;
// const parsePropertiesBinary = FlatgeobufFeature.parseProperties;

const GEOMETRY_COLUMN_NAME = 'geometry';

export type ParseFlatGeobufOptions = {
  shape?: 'geojson-table' | 'columnar-table' | 'binary' | 'arrow-table';
  /** If supplied, only loads features within the bounding box */
  boundingBox?: [[number, number], [number, number]];
  /** Desired output CRS */
  crs?: string;
  /** Should geometries be reprojected to target CRS */
  reproject?: boolean;
};

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param arrayBuffer  A FlatGeobuf arrayBuffer
 * @return A GeoJSON geometry object
 */
export function parseFlatGeobuf(arrayBuffer: ArrayBuffer, options: ParseFlatGeobufOptions): Table {
  const shape = options.shape;

  switch (shape) {
    case 'geojson-table': {
      return parseFlatGeobufToGeoJSONTable(arrayBuffer, options);
    }

    case 'columnar-table': // binary + some JS arrays
      const binary = parseFlatGeobufToBinary(arrayBuffer, options);
      // @ts-expect-error
      return {shape: 'columnar-table', data: binary};

    case 'binary':
      // @ts-expect-error
      return parseFlatGeobufToBinary(arrayBuffer, options);

    case 'arrow-table':
      return parseFlatGeobufToArrowTable(arrayBuffer, options);

    default:
      throw new Error(shape);
  }
}

function parseFlatGeobufToBinary(arrayBuffer: ArrayBuffer, options: ParseFlatGeobufOptions = {}) {
  // TODO: reproject binary features
  // const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const array = new Uint8Array(arrayBuffer);
  // @ts-expect-error
  return deserializeGeneric(array, fgbToBinaryGeometry);
}

function parseFlatGeobufToGeoJSONTable(
  arrayBuffer: ArrayBuffer,
  options: ParseFlatGeobufOptions
): GeoJSONTable {
  if (arrayBuffer.byteLength === 0) {
    return {shape: 'geojson-table', type: 'FeatureCollection', features: []};
  }

  const {reproject = false, crs = 'WGS84'} = options;

  const arr = new Uint8Array(arrayBuffer);

  let fgbHeader: fgb.HeaderMeta | undefined;
  let schema: Schema | undefined;

  const rect = options.boundingBox && convertBoundingBox(options.boundingBox);

  // @ts-expect-error this looks wrong
  let {features} = deserializeGeoJson(arr, rect, headerMeta => {
    fgbHeader = headerMeta;
    schema = getSchemaFromFGBHeader(fgbHeader);
  });

  const fromCRS = fgbHeader?.crs?.wkt;
  let projection;
  if (reproject && fromCRS) {
    // Constructing the projection may fail for some invalid WKT strings
    try {
      projection = new Proj4Projection({from: fromCRS, to: crs});
    } catch (_error) {
      // no op
    }
  }

  if (projection) {
    features = transformGeoJsonCoords(features, coords => projection.project(coords));
  }

  return {shape: 'geojson-table', schema, type: 'FeatureCollection', features};
}

function parseFlatGeobufToArrowTable(
  arrayBuffer: ArrayBuffer,
  options: ParseFlatGeobufOptions
): ArrowTable {
  if (arrayBuffer.byteLength === 0) {
    return new ArrowTableBuilder(makeArrowSchema()).finishTable();
  }

  const {reproject = false, crs = 'WGS84'} = options;
  const arr = new Uint8Array(arrayBuffer);

  let fgbHeader: fgb.HeaderMeta | undefined;
  let arrowSchema: Schema | undefined;

  // @ts-expect-error upstream typing does not model header callback well
  const {features} = deserializeGeoJson(arr, undefined, headerMeta => {
    fgbHeader = headerMeta;
    arrowSchema = makeArrowSchema(fgbHeader);
  });

  const projection = getProjection(fgbHeader, reproject, crs);
  const tableBuilder = new ArrowTableBuilder(arrowSchema || makeArrowSchema());

  for (const feature of features) {
    const normalizedFeature = projection
      ? transformGeoJsonCoords([feature], coords => projection.project(coords))[0]
      : feature;
    tableBuilder.addObjectRow(makeArrowRow(normalizedFeature, fgbHeader));
  }

  return tableBuilder.finishTable();
}

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param {ReadableStream} _ A FlatGeobuf arrayBuffer
 * @return  A GeoJSON geometry object iterator
 */
// eslint-disable-next-line complexity
export function parseFlatGeobufInBatches(stream, options: ParseFlatGeobufOptions) {
  const shape = options.shape;
  switch (shape) {
    case 'binary':
      return parseFlatGeobufInBatchesToBinary(stream, options);
    case 'geojson-table':
      return parseFlatGeobufInBatchesToGeoJSON(stream, options);
    case 'arrow-table':
      return parseFlatGeobufInBatchesToArrow(stream, options);
    default:
      throw new Error(shape);
  }
}

function parseFlatGeobufInBatchesToBinary(stream, options: ParseFlatGeobufOptions) {
  // TODO: reproject binary streaming features
  // const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const rect = options.boundingBox && convertBoundingBox(options.boundingBox);

  // @ts-expect-error
  const iterator = deserializeGeneric(stream, binaryFromFeature, rect);
  return iterator;
}

/**
 * @todo this does not return proper GeoJSONTable batches
 * @param stream
 * @param options
 */
// eslint-disable-next-line complexity
async function* parseFlatGeobufInBatchesToGeoJSON(stream, options: ParseFlatGeobufOptions) {
  const {reproject = false, crs = 'WGS84'} = options || {};

  let fgbHeader;
  // let schema: Schema | undefined;
  const iterator = deserializeGeoJson(stream, undefined, headerMeta => {
    fgbHeader = headerMeta;
    // schema = getSchemaFromFGBHeader(fgbHeader);
  });

  let projection;
  let firstRecord = true;
  // @ts-expect-error this looks wrong
  for await (const feature of iterator) {
    if (firstRecord) {
      const fromCRS = fgbHeader?.crs?.wkt;
      if (reproject && fromCRS) {
        projection = new Proj4Projection({from: fromCRS, to: crs});
      }

      firstRecord = false;
    }

    if (reproject && projection) {
      // eslint-disable-next-line
      yield transformGeoJsonCoords([feature], coords => projection.project(coords));
    } else {
      yield feature;
    }
  }
}

async function* parseFlatGeobufInBatchesToArrow(
  stream,
  options: ParseFlatGeobufOptions
): AsyncGenerator<ArrowTableBatch> {
  const {reproject = false, crs = 'WGS84'} = options || {};

  let fgbHeader: fgb.HeaderMeta | undefined;
  let arrowSchema: Schema | undefined;
  let projection: Proj4Projection | undefined;
  let yieldedBatch = false;

  const iterator = deserializeGeoJson(stream, undefined, headerMeta => {
    fgbHeader = headerMeta;
    arrowSchema = makeArrowSchema(fgbHeader);
    projection = getProjection(fgbHeader, reproject, crs);
  });

  for await (const feature of iterator) {
    const batchBuilder = new ArrowTableBuilder(arrowSchema || makeArrowSchema());
    const normalizedFeature = projection
      ? transformGeoJsonCoords([feature], coords => projection!.project(coords))[0]
      : feature;
    batchBuilder.addObjectRow(makeArrowRow(normalizedFeature, fgbHeader));
    const batch = batchBuilder.finishBatch();
    if (batch) {
      yieldedBatch = true;
      yield batch;
    }
  }

  if (!yieldedBatch) {
    yield makeEmptyArrowBatch(arrowSchema || makeArrowSchema(fgbHeader));
  }
}

// HELPERS

function convertBoundingBox(boundingBox: [[number, number], [number, number]]): fgb.Rect {
  return {
    minX: boundingBox[0][0],
    minY: boundingBox[0][1],
    maxX: boundingBox[1][0],
    maxY: boundingBox[1][1]
  };
}

// TODO: reproject binary features
function binaryFromFeature(feature: fgb.Feature, header: fgb.HeaderMeta) {
  const geometry = feature.geometry();

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  // I believe geometry.type() is null (0) except when the geometry type isn't
  // known in the header?
  const geometryType = header.geometryType || geometry?.type();
  const parsedGeometry = fgbToBinaryGeometry(geometry, geometryType!);
  // @ts-expect-error this looks wrong
  parsedGeometry.properties = parsePropertiesBinary(feature, header.columns);

  // TODO: wrap binary data either in points, lines, or polygons key
  return parsedGeometry;
}

function makeArrowSchema(fgbHeader?: fgb.HeaderMeta): Schema {
  const sourceSchema = fgbHeader ? getSchemaFromFGBHeader(fgbHeader) : {fields: [], metadata: {}};
  const fields = sourceSchema.fields.map((field, fieldIndex) =>
    normalizeFieldForArrow(field, fgbHeader?.columns?.[fieldIndex]?.type)
  );
  fields.push({
    name: GEOMETRY_COLUMN_NAME,
    type: 'binary',
    nullable: true,
    metadata: {}
  });

  const geometryTypes = getGeometryTypesForMetadata(fgbHeader?.geometryType);

  return {
    fields,
    metadata: {
      ...sourceSchema.metadata,
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: GEOMETRY_COLUMN_NAME,
        columns: {
          [GEOMETRY_COLUMN_NAME]: {
            encoding: 'wkb',
            geometry_types: geometryTypes
          }
        }
      })
    }
  };
}

function normalizeFieldForArrow(field: Field, columnType?: ColumnType): Field {
  if (columnType === ColumnType.Json) {
    return {...field, type: 'utf8'};
  }

  return field;
}

function makeArrowRow(feature: Feature, fgbHeader?: fgb.HeaderMeta): Record<string, unknown> {
  const row = normalizePropertiesForArrow(feature.properties || {}, fgbHeader);
  row[GEOMETRY_COLUMN_NAME] = feature.geometry
    ? new Uint8Array(convertGeometryToWKB(feature.geometry))
    : null;
  return row;
}

function normalizePropertiesForArrow(
  properties: Record<string, unknown>,
  fgbHeader?: fgb.HeaderMeta
): Record<string, unknown> {
  const normalizedProperties: Record<string, unknown> = {};

  for (const [propertyName, value] of Object.entries(properties)) {
    const columnType = fgbHeader?.columns?.find(column => column.name === propertyName)?.type;
    switch (columnType) {
      case ColumnType.Json:
        normalizedProperties[propertyName] = value === null ? null : JSON.stringify(value);
        break;
      case ColumnType.DateTime:
        normalizedProperties[propertyName] = typeof value === 'string' ? new Date(value) : value;
        break;
      default:
        normalizedProperties[propertyName] = value;
        break;
    }
  }

  return normalizedProperties;
}

function getProjection(
  fgbHeader: fgb.HeaderMeta | undefined,
  reproject: boolean,
  crs: string
): Proj4Projection | undefined {
  const fromCRS = fgbHeader?.crs?.wkt;
  if (!reproject || !fromCRS) {
    return undefined;
  }

  try {
    return new Proj4Projection({from: fromCRS, to: crs});
  } catch (_error) {
    return undefined;
  }
}

function getGeometryTypesForMetadata(geometryType?: GeometryType): string[] {
  switch (geometryType) {
    case GeometryType.Point:
      return ['Point'];
    case GeometryType.LineString:
      return ['LineString'];
    case GeometryType.Polygon:
      return ['Polygon'];
    case GeometryType.MultiPoint:
      return ['MultiPoint'];
    case GeometryType.MultiLineString:
      return ['MultiLineString'];
    case GeometryType.MultiPolygon:
      return ['MultiPolygon'];
    case GeometryType.GeometryCollection:
      return ['GeometryCollection'];
    default:
      return [];
  }
}

function makeEmptyArrowBatch(schema: Schema): ArrowTableBatch {
  const table = new ArrowTableBuilder(schema).finishTable();
  return {
    shape: 'arrow-table',
    batchType: 'data',
    length: 0,
    schema,
    data: table.data
  };
}
