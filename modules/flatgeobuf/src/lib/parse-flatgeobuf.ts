// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {Proj4Projection, type Proj4CRSDefinition} from '@math.gl/proj4';
import type {ArrowTable, ArrowTableBatch, Feature, Field, Schema, Table} from '@loaders.gl/schema';
import {
  filterColumnarRowIndices,
  planTableQuery,
  type ColumnarPredicate,
  type TableQueryOptions
} from '@loaders.gl/loader-utils';
import {
  convertGeojsonToBinaryFeatureCollection,
  encodeWKBGeometryValue,
  GeoArrowBuilder,
  makeGeoArrowGeometryField,
  setGeoArrowGeometryColumnMetadata,
  transformGeoJsonCoords,
  type GeoArrowBuilderEncoding,
  type GeoParquetGeometryType
} from '@loaders.gl/gis';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {
  decodeFlatGeobufGeometry,
  FlatGeobufColumnType,
  FlatGeobufGeometryType,
  readFlatGeobufFeatures,
  readFlatGeobufHeader,
  writeFlatGeobufGeometry,
  type FlatGeobufHeader
} from './flatgeobuf-reader';

const GEOMETRY_COLUMN_NAME = 'geometry';

export type ParseFlatGeobufOptions = {
  shape?: 'geojson-table' | 'columnar-table' | 'binary-geometry' | 'arrow-table';
  boundingBox?: [[number, number], [number, number]];
  crs?: Proj4CRSDefinition;
  reproject?: boolean;
};

/** Portable FlatGeobuf query options, with an indexed spatial envelope. */
export type FlatGeobufQueryOptions<PredicateT extends ColumnarPredicate = ColumnarPredicate> =
  TableQueryOptions<PredicateT> &
    Readonly<{
      /** Bounding box used to prune features before property decoding. */
      boundingBox?: [[number, number], [number, number]];
      /** Cancels parsing before or during feature materialization. */
      signal?: AbortSignal;
    }>;

/** Parses a FlatGeobuf buffer through the Arrow-native decode pipeline. */
export function parseFlatGeobuf(
  arrayBuffer: ArrayBuffer,
  options: ParseFlatGeobufOptions
): Table | any {
  const arrowTable = parseFlatGeobufToArrowTable(arrayBuffer, options);
  switch (options.shape) {
    case 'arrow-table':
      return arrowTable;
    case 'geojson-table':
      return makeGeoJsonTable(arrayBuffer, options);
    case 'binary-geometry':
      return convertGeojsonToBinaryFeatureCollection(
        makeGeoJsonTable(arrayBuffer, options).features
      );
    case 'columnar-table':
      return {
        shape: 'columnar-table',
        schema: arrowTable.schema,
        data: Object.fromEntries(
          (arrowTable.schema?.fields || []).map(field => [
            field.name,
            arrowTable.data.getChild(field.name)?.toArray()
          ])
        )
      } as Table;
    default:
      throw new Error(`Unsupported FlatGeobuf output shape ${options.shape}`);
  }
}

/** Parses FlatGeobuf into typed GeoArrow and Apache Arrow buffers. */
export function parseFlatGeobufToArrowTable(
  arrayBuffer: ArrayBuffer,
  options: ParseFlatGeobufOptions = {}
): ArrowTable {
  const header = readFlatGeobufHeader(arrayBuffer);
  const schema = makeArrowSchema(header);
  const projection = getProjection(header, options.reproject, options.crs || 'WGS84');
  const geometryOptions = {encoding: getGeometryEncoding(header.geometryType), hasZ: header.hasZ};
  const measuredGeometry = new GeoArrowBuilder({mode: 'measure', ...geometryOptions});
  for (const feature of readFlatGeobufFeatures(arrayBuffer, header)) {
    if (matchesBoundingBox(arrayBuffer, feature.geometryOffset, header, options.boundingBox))
      writeGeometry(measuredGeometry, arrayBuffer, feature.geometryOffset, header);
  }
  const geometryArray = measuredGeometry.getGeometryArray();
  const geometryBuilder = new GeoArrowBuilder({
    mode: 'write',
    target: geometryArray,
    transform: projection?.project,
    ...geometryOptions
  });
  const arrowSchema = convertSchemaToArrow(schema);
  const propertyBuilders = arrowSchema.fields
    .slice(0, -1)
    .map(field => arrow.makeBuilder({type: field.type, nullValues: [null]}));
  for (const feature of readFlatGeobufFeatures(arrayBuffer, header)) {
    if (!matchesBoundingBox(arrayBuffer, feature.geometryOffset, header, options.boundingBox))
      continue;
    for (let index = 0; index < header.columns.length; index++)
      propertyBuilders[index].append(feature.properties[header.columns[index].name] ?? null);
    writeGeometry(geometryBuilder, arrayBuffer, feature.geometryOffset, header);
  }
  const propertyData = propertyBuilders.map(builder => {
    const data = builder.flush();
    builder.finish();
    return data;
  });
  const geometryData = GeoArrowBuilder.makeGeometryData(geometryBuilder.getGeometryArray());
  const structData = new arrow.Data(
    new arrow.Struct(arrowSchema.fields),
    0,
    geometryArray.length,
    0,
    undefined,
    [...propertyData, geometryData]
  );
  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [new arrow.RecordBatch(arrowSchema, structData)])
  };
}

/** Executes a portable projection, residual predicate, and limit over FlatGeobuf features. */
export function queryFlatGeobufArrowTable(
  arrayBuffer: ArrayBuffer,
  options: FlatGeobufQueryOptions = {}
): ArrowTable {
  throwIfAborted(options.signal);
  const sourceTable = parseFlatGeobufToArrowTable(arrayBuffer, {
    boundingBox: options.boundingBox
  });
  const sourceColumnNames = sourceTable.data.schema.fields.map(field => field.name);
  const plan = planTableQuery(sourceColumnNames, options);
  const scanStep = plan.find(step => step.kind === 'scan');
  const projectStep = plan.find(step => step.kind === 'project');
  if (!scanStep || scanStep.kind !== 'scan' || !projectStep || projectStep.kind !== 'project') {
    throw new Error('FlatGeobuf query planner produced an invalid plan.');
  }
  const scannedColumns: Record<string, any[]> = {};
  for (const columnName of scanStep.columns) {
    const column = sourceTable.data.getChild(columnName);
    if (!column) throw new Error(`FlatGeobuf query could not read column "${columnName}".`);
    scannedColumns[columnName] = column.toArray();
  }
  const predicateStep = plan.find(step => step.kind === 'filter');
  const limitStep = plan.find(step => step.kind === 'limit');
  const matchingRowIndices =
    predicateStep?.kind === 'filter'
      ? filterColumnarRowIndices(predicateStep.predicate, scannedColumns, sourceTable.data.numRows)
      : Array.from({length: sourceTable.data.numRows}, (_, index) => index);
  const limit = limitStep?.kind === 'limit' ? limitStep.limit : matchingRowIndices.length;
  const rowIndices = matchingRowIndices.slice(0, limit);
  const projectedSchema = sourceTable.data.select([...projectStep.columns]).schema;
  const sourceSchema = sourceTable.schema;
  if (!sourceSchema) throw new Error('FlatGeobuf query source is missing a schema.');
  const outputColumns: Record<string, arrow.Vector> = {};
  for (const field of projectedSchema.fields) {
    const column = sourceTable.data.getChild(field.name);
    if (!column) throw new Error(`FlatGeobuf query could not project column "${field.name}".`);
    outputColumns[field.name] = arrow.vectorFromArray(
      rowIndices.map(rowIndex => column.get(rowIndex)),
      column.type
    );
  }
  return {
    shape: 'arrow-table',
    schema: {
      ...sourceSchema,
      fields: projectStep.columns
        .map(columnName => sourceSchema.fields.find(field => field.name === columnName))
        .filter((field): field is Field => Boolean(field))
    },
    data: new arrow.Table(projectedSchema, outputColumns)
  };
}

/** Loads FlatGeobuf as small Arrow batches; each batch is a stable-schema table. */
export async function* parseFlatGeobufInBatches(
  stream: ReadableStream,
  options: ParseFlatGeobufOptions
): AsyncGenerator<ArrowTableBatch> {
  const arrayBuffer = await new Response(stream).arrayBuffer();
  const table = parseFlatGeobufToArrowTable(arrayBuffer, options);
  yield {
    shape: 'arrow-table',
    batchType: 'data',
    length: table.data.numRows,
    schema: table.schema,
    data: table.data
  };
}

/** Creates the public Arrow schema from FlatGeobuf header metadata. */
export function makeArrowSchema(header: FlatGeobufHeader | any): Schema {
  const fields: Field[] = header.columns.map(column => ({
    name: column.name,
    type: getArrowType(column.type),
    nullable: column.nullable,
    metadata: {
      title: column.title || '',
      description: column.description || '',
      width: String(column.width),
      precision: String(column.precision),
      scale: String(column.scale),
      unique: String(column.unique),
      primary_key: String(column.primaryKey)
    }
  }));
  const encoding = getGeometryEncoding(header.geometryType);
  fields.push(
    makeGeoArrowGeometryField({
      geometryColumnName: GEOMETRY_COLUMN_NAME,
      encoding,
      coordinateSize: header.hasZ ? 3 : 2
    })
  );
  const schema: Schema = {
    fields,
    metadata: {
      title: header.title || '',
      description: header.description || '',
      crs: JSON.stringify(header.crs || {}),
      metadata: header.metadata || '',
      geometryType: String(header.geometryType),
      indexNodeSize: String(header.indexNodeSize),
      featureCount: String(header.featuresCount),
      bounds: header.envelope?.join(',') || ''
    }
  };
  setGeoArrowGeometryColumnMetadata(schema.metadata!, {
    geometryColumnName: GEOMETRY_COLUMN_NAME,
    encoding,
    geometryTypes: [getGeometryType(header.geometryType, header.hasZ)]
  });
  return schema;
}

/** Encodes one legacy source-loader feature as a WKB Arrow object row. */
export function makeArrowRow(feature: Feature, _header?: unknown): Record<string, unknown> {
  return {
    ...(feature.properties || {}),
    [GEOMETRY_COLUMN_NAME]: encodeWKBGeometryValue(feature.geometry)
  };
}

function makeGeoJsonTable(arrayBuffer: ArrayBuffer, options: ParseFlatGeobufOptions) {
  const header = readFlatGeobufHeader(arrayBuffer);
  let features: Feature[] = [];
  for (const feature of readFlatGeobufFeatures(arrayBuffer, header))
    features.push({
      type: 'Feature',
      properties: feature.properties,
      geometry: decodeFlatGeobufGeometry(arrayBuffer, feature.geometryOffset, header)
    });
  if (options.boundingBox)
    features = features.filter(feature =>
      intersectsBoundingBox(feature.geometry, options.boundingBox!)
    );
  const projection = getProjection(header, options.reproject, options.crs || 'WGS84');
  if (projection)
    features = transformGeoJsonCoords(features, coordinates => projection.project(coordinates));
  return {
    shape: 'geojson-table' as const,
    schema: makePropertySchema(header),
    type: 'FeatureCollection' as const,
    features
  };
}

function writeGeometry(
  builder: GeoArrowBuilder,
  arrayBuffer: ArrayBuffer,
  geometryOffset: number | undefined,
  header: FlatGeobufHeader
): void {
  writeFlatGeobufGeometry(builder, arrayBuffer, geometryOffset, header);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    throw error;
  }
}

function getGeometryEncoding(type: FlatGeobufGeometryType): GeoArrowBuilderEncoding {
  switch (type) {
    case FlatGeobufGeometryType.Point:
      return 'geoarrow.point';
    case FlatGeobufGeometryType.LineString:
      return 'geoarrow.linestring';
    case FlatGeobufGeometryType.Polygon:
      return 'geoarrow.polygon';
    case FlatGeobufGeometryType.MultiPoint:
      return 'geoarrow.multipoint';
    case FlatGeobufGeometryType.MultiLineString:
      return 'geoarrow.multilinestring';
    case FlatGeobufGeometryType.MultiPolygon:
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`Unsupported FlatGeobuf geometry type ${type}`);
  }
}
function getGeometryType(type: FlatGeobufGeometryType, hasZ: boolean): GeoParquetGeometryType {
  const names: Record<FlatGeobufGeometryType, string> = {
    0: 'Geometry',
    1: 'Point',
    2: 'LineString',
    3: 'Polygon',
    4: 'MultiPoint',
    5: 'MultiLineString',
    6: 'MultiPolygon',
    7: 'GeometryCollection'
  };
  return `${names[type]}${hasZ ? ' Z' : ''}` as GeoParquetGeometryType;
}
function getArrowType(type: FlatGeobufColumnType): Field['type'] {
  switch (type) {
    case FlatGeobufColumnType.Byte:
      return 'int8';
    case FlatGeobufColumnType.UByte:
      return 'uint8';
    case FlatGeobufColumnType.Bool:
      return 'bool';
    case FlatGeobufColumnType.Short:
      return 'int16';
    case FlatGeobufColumnType.UShort:
      return 'uint16';
    case FlatGeobufColumnType.Int:
      return 'int32';
    case FlatGeobufColumnType.UInt:
      return 'uint32';
    case FlatGeobufColumnType.Long:
      return 'int64';
    case FlatGeobufColumnType.ULong:
      return 'uint64';
    case FlatGeobufColumnType.Float:
      return 'float32';
    case FlatGeobufColumnType.Double:
      return 'float64';
    case FlatGeobufColumnType.String:
    case FlatGeobufColumnType.Json:
      return 'utf8';
    case FlatGeobufColumnType.DateTime:
      return 'date-millisecond';
    case FlatGeobufColumnType.Binary:
      return 'binary';
    default:
      return 'null';
  }
}
export function getProjection(
  header: FlatGeobufHeader | any,
  reproject = false,
  crs: Proj4CRSDefinition = 'WGS84'
): Proj4Projection | undefined {
  if (!reproject) return undefined;
  const sourceCrs =
    header.crs?.wkt ||
    header.crs?.codeString ||
    (Number.isFinite(header.crs?.code) ? `EPSG:${header.crs.code}` : undefined);
  if (!sourceCrs) {
    throw new Error('FlatGeobuf reprojection requires a source CRS in the file header');
  }
  try {
    return new Proj4Projection({from: sourceCrs, to: crs});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`FlatGeobuf reprojection failed: ${message}`);
  }
}
function intersectsBoundingBox(
  geometry: any,
  boundingBox: [[number, number], [number, number]]
): boolean {
  const coordinates: number[][] = [];
  const collect = (value: any) =>
    Array.isArray(value?.[0]) ? value.forEach(collect) : coordinates.push(value);
  collect(geometry?.coordinates);
  return coordinates.some(
    ([x, y]) =>
      x >= boundingBox[0][0] &&
      x <= boundingBox[1][0] &&
      y >= boundingBox[0][1] &&
      y <= boundingBox[1][1]
  );
}
function matchesBoundingBox(
  arrayBuffer: ArrayBuffer,
  geometryOffset: number | undefined,
  header: FlatGeobufHeader,
  boundingBox?: [[number, number], [number, number]]
): boolean {
  return (
    !boundingBox ||
    intersectsBoundingBox(
      decodeFlatGeobufGeometry(arrayBuffer, geometryOffset, header),
      boundingBox
    )
  );
}
function makePropertySchema(header: FlatGeobufHeader): Schema {
  const schema = makeArrowSchema(header);
  return {...schema, fields: schema.fields.slice(0, -1)};
}
