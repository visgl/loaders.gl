/* eslint-disable camelcase */
import {isBrowser} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  DataType,
  Feature,
  Field,
  Geometry,
  GeoJSONTable,
  Schema,
  Tables
} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {
  type GeoParquetGeometryType,
  encodeWKBGeometryValue,
  makeWKBGeometryField,
  setWKBGeometrySchemaMetadata,
  convertWKBToGeometry,
  transformGeoJsonCoords
} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';
import initSqlJs, {Database, SqlJsStatic, Statement} from 'sql.js';

import type {GeoPackageLoaderOptions} from '../geopackage-loader';
import type {
  DataColumnsMapping,
  DataColumnsRow,
  GeoPackageGeometryTypes,
  GeoPackageVectorTableInfo,
  GeometryBitFlags,
  PragmaTableInfoRow,
  ProjectionMapping,
  SpatialRefSysRow,
  SQLiteTypes
} from './types';

const SQL_JS_VERSION = '1.14.1';
const GEOMETRY_OUTPUT_COLUMN_NAME = 'geometry';

/**
 * We pin to the same version as sql.js that we use.
 */
export const DEFAULT_SQLJS_CDN = isBrowser
  ? `https://cdn.jsdelivr.net/npm/sql.js@${SQL_JS_VERSION}/dist/`
  : null;

// https://www.geopackage.org/spec121/#flags_layout
const ENVELOPE_BYTE_LENGTHS = {
  0: 0,
  1: 32,
  2: 48,
  3: 48,
  4: 64,
  5: 0,
  6: 0,
  7: 0
};

// Documentation: https://www.geopackage.org/spec130/index.html#table_column_data_types
const SQL_TYPE_MAPPING: Record<SQLiteTypes | GeoPackageGeometryTypes, DataType> = {
  BOOLEAN: 'bool',
  TINYINT: 'int8',
  SMALLINT: 'int16',
  MEDIUMINT: 'int32',
  INT: 'int32',
  INTEGER: 'int32',
  FLOAT: 'float32',
  DOUBLE: 'float64',
  REAL: 'float64',
  TEXT: 'utf8',
  BLOB: 'binary',
  DATE: 'utf8',
  DATETIME: 'utf8',
  GEOMETRY: 'binary',
  POINT: 'binary',
  LINESTRING: 'binary',
  POLYGON: 'binary',
  MULTIPOINT: 'binary',
  MULTILINESTRING: 'binary',
  MULTIPOLYGON: 'binary',
  GEOMETRYCOLLECTION: 'binary'
};

const DEFAULT_TABLE_MARKERS = new Set(['default', 'default table', 'main', 'primary']);

/** Parses a GeoPackage into GeoJSON output using the existing GeoPackageLoader shapes. */
export async function parseGeoPackage(
  arrayBuffer: ArrayBuffer,
  options?: GeoPackageLoaderOptions
): Promise<GeoJSONTable | Tables<GeoJSONTable> | ArrowTable> {
  const database = await loadGeoPackageDatabase(
    arrayBuffer,
    options?.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN
  );
  const vectorTables = listGeoPackageVectorTables(database);
  const projections = getProjections(database);
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  const shape = options?.geopackage?.shape || 'tables';

  switch (shape) {
    case 'geojson-table': {
      const selectedTable = selectGeoPackageVectorTable(vectorTables, options?.geopackage?.table);
      return getGeoPackageGeoJSONTable(database, selectedTable, projections, {
        reproject,
        targetCrs: _targetCrs
      });
    }
    case 'arrow-table':
      return parseGeoPackageToArrow(arrayBuffer, options);

    case 'tables': {
      const outputTables: Tables<GeoJSONTable> = {
        shape: 'tables',
        tables: []
      };

      for (const vectorTable of vectorTables) {
        outputTables.tables.push({
          name: vectorTable.name,
          table: getGeoPackageGeoJSONTable(database, vectorTable, projections, {
            reproject,
            targetCrs: _targetCrs
          })
        });
      }

      return outputTables;
    }

    default:
      throw new Error(`Unsupported GeoPackage output shape: ${shape}`);
  }
}

/** Parses one selected GeoPackage vector table into a WKB-backed Arrow table. */
export async function parseGeoPackageToArrow(
  arrayBuffer: ArrayBuffer,
  options?: GeoPackageLoaderOptions
): Promise<ArrowTable> {
  const database = await loadGeoPackageDatabase(
    arrayBuffer,
    options?.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN
  );
  const vectorTables = listGeoPackageVectorTables(database);
  const selectedTable = selectGeoPackageVectorTable(vectorTables, options?.geopackage?.table);
  const projections = getProjections(database);
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};

  return getGeoPackageArrowTable(database, selectedTable, projections, {
    reproject,
    targetCrs: _targetCrs
  });
}

/** Initialize SQL.js and create a GeoPackage database handle. */
export async function loadGeoPackageDatabase(
  arrayBuffer: ArrayBuffer,
  sqlJsCDN: string | null
): Promise<Database> {
  let sql: SqlJsStatic;
  if (sqlJsCDN) {
    sql = await initSqlJs({
      locateFile: fileName => `${sqlJsCDN}${fileName}`
    });
  } else {
    sql = await initSqlJs();
  }

  return new sql.Database(new Uint8Array(arrayBuffer));
}

/** Reads vector table metadata by joining `gpkg_contents` and `gpkg_geometry_columns`. */
export function listGeoPackageVectorTables(database: Database): GeoPackageVectorTableInfo[] {
  const statement = database.prepare(`
    SELECT
      gpkg_contents.table_name,
      gpkg_contents.identifier,
      gpkg_contents.description,
      gpkg_contents.last_change,
      gpkg_contents.min_x,
      gpkg_contents.min_y,
      gpkg_contents.max_x,
      gpkg_contents.max_y,
      gpkg_contents.srs_id,
      gpkg_geometry_columns.column_name,
      gpkg_geometry_columns.geometry_type_name,
      gpkg_geometry_columns.z,
      gpkg_geometry_columns.m
    FROM gpkg_contents
    INNER JOIN gpkg_geometry_columns
      ON gpkg_contents.table_name = gpkg_geometry_columns.table_name
    WHERE gpkg_contents.data_type='features';
  `);

  const vectorTables: GeoPackageVectorTableInfo[] = [];
  while (statement.step()) {
    const row = statement.getAsObject() as Record<string, unknown>;
    const bounds = getGeoPackageBounds(row);
    vectorTables.push({
      name: String(row.table_name),
      identifier: normalizeOptionalString(row.identifier),
      description: normalizeOptionalString(row.description),
      lastChange: String(row.last_change),
      srsId: normalizeOptionalNumber(row.srs_id),
      geometryColumnName: String(row.column_name),
      geometryTypeName: String(row.geometry_type_name) as GeoPackageGeometryTypes,
      z: Number(row.z) as 0 | 1 | 2,
      m: Number(row.m) as 0 | 1 | 2,
      bounds
    });
  }

  return vectorTables;
}

/** Selects a vector table by explicit name, explicit preference marker, or first-table fallback. */
export function selectGeoPackageVectorTable(
  vectorTables: GeoPackageVectorTableInfo[],
  tableName?: string
): GeoPackageVectorTableInfo {
  if (!vectorTables.length) {
    throw new Error('GeoPackage contains no vector feature tables.');
  }

  if (tableName) {
    const selectedTable = vectorTables.find(vectorTable => vectorTable.name === tableName);
    if (!selectedTable) {
      throw new Error(`GeoPackage table not found: ${tableName}`);
    }
    return selectedTable;
  }

  if (vectorTables.length === 1) {
    return vectorTables[0];
  }

  const preferredTable = vectorTables.find(
    vectorTable =>
      isDefaultTableMarker(vectorTable.identifier) || isDefaultTableMarker(vectorTable.name)
  );

  return preferredTable || vectorTables[0];
}

/** Loads one vector table as a GeoJSON feature collection. */
export function getGeoPackageGeoJSONTable(
  database: Database,
  vectorTable: GeoPackageVectorTableInfo,
  projections: ProjectionMapping,
  options: {reproject: boolean; targetCrs: string}
): GeoJSONTable {
  const dataColumns = getDataColumns(database, vectorTable.name);
  const featureIdColumn = getFeatureIdName(database, vectorTable.name);
  const queryResult = database.exec(`SELECT * FROM \`${vectorTable.name}\`;`)[0];
  const columns = queryResult?.columns || [];
  const values = queryResult?.values || [];
  const projection = getProjection(vectorTable, projections, options);

  const geojsonFeatures = values.map(row =>
    constructGeoJsonFeature(columns, row, vectorTable, dataColumns, featureIdColumn, projection)
  );

  return {
    shape: 'geojson-table',
    schema: getSchema(database, vectorTable.name),
    type: 'FeatureCollection',
    // @ts-expect-error TODO - null geometries causing problems...
    features: geojsonFeatures
  };
}

/** Loads one vector table as an Arrow table with a WKB geometry column. */
export function getGeoPackageArrowTable(
  database: Database,
  vectorTable: GeoPackageVectorTableInfo,
  projections: ProjectionMapping,
  options: {reproject: boolean; targetCrs: string}
): ArrowTable {
  const queryResult = database.exec(`SELECT * FROM \`${vectorTable.name}\`;`)[0];
  const columns = queryResult?.columns || [];
  const values = queryResult?.values || [];
  const projection = getProjection(vectorTable, projections, options);
  const schema = getArrowSchema(database, vectorTable);
  const tableBuilder = new ArrowTableBuilder(schema);

  for (const row of values) {
    tableBuilder.addObjectRow(
      constructArrowRow(columns, row, vectorTable.geometryColumnName, projection)
    );
  }

  return tableBuilder.finishTable();
}

/** Find all projections defined in GeoPackage. */
export function getProjections(database: Database): ProjectionMapping {
  const statement = database.prepare('SELECT * FROM gpkg_spatial_ref_sys;');
  const projectionMapping: ProjectionMapping = {};

  while (statement.step()) {
    const projectionRow = statement.getAsObject() as unknown as SpatialRefSysRow;
    projectionMapping[projectionRow.srs_id] = projectionRow.definition;
  }

  return projectionMapping;
}

function constructGeoJsonFeature(
  columns: string[],
  row: unknown[],
  vectorTable: GeoPackageVectorTableInfo,
  dataColumns: DataColumnsMapping | null,
  featureIdColumn: string | null,
  projection: Proj4Projection | null
): Feature<Geometry | null> {
  const featureIdIndex = featureIdColumn ? columns.indexOf(featureIdColumn) : -1;
  const geometryColumnIndex = columns.indexOf(vectorTable.geometryColumnName);
  const rawGeometry = parseGeometry(row[geometryColumnIndex]);
  const geometry = projection ? reprojectGeometry(rawGeometry, projection) : rawGeometry;

  const properties: Record<string, unknown> = {};
  if (dataColumns) {
    for (const [columnName, propertyName] of Object.entries(dataColumns)) {
      const columnIndex = columns.indexOf(columnName);
      const outputName = propertyName || columnName;
      properties[outputName] = row[columnIndex];
    }
  } else {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      if (columnIndex === featureIdIndex || columnIndex === geometryColumnIndex) {
        continue;
      }
      properties[columns[columnIndex]] = row[columnIndex];
    }
  }

  return {
    id:
      featureIdIndex >= 0 &&
      (typeof row[featureIdIndex] === 'string' || typeof row[featureIdIndex] === 'number')
        ? row[featureIdIndex]
        : undefined,
    type: 'Feature',
    geometry,
    properties
  };
}

function constructArrowRow(
  columns: string[],
  row: unknown[],
  geometryColumnName: string,
  projection: Proj4Projection | null
): Record<string, unknown> {
  const arrowRow: Record<string, unknown> = {};

  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    const columnName = columns[columnIndex];
    const value = row[columnIndex];

    if (columnName === geometryColumnName) {
      const geometry = parseGeometry(value);
      const projectedGeometry = projection ? reprojectGeometry(geometry, projection) : geometry;
      arrowRow[GEOMETRY_OUTPUT_COLUMN_NAME] = encodeWKBGeometryValue(projectedGeometry);
      continue;
    }

    arrowRow[columnName] = value;
  }

  return arrowRow;
}

function getProjection(
  vectorTable: GeoPackageVectorTableInfo,
  projections: ProjectionMapping,
  options: {reproject: boolean; targetCrs: string}
): Proj4Projection | null {
  if (!options.reproject || vectorTable.srsId === undefined) {
    return null;
  }

  const sourceProjection = projections[vectorTable.srsId];
  if (!sourceProjection) {
    return null;
  }

  return new Proj4Projection({
    from: sourceProjection,
    to: options.targetCrs
  });
}

function reprojectGeometry(
  geometry: Geometry | null,
  projection: Proj4Projection
): Geometry | null {
  if (!geometry) {
    return null;
  }

  const feature = {type: 'Feature', geometry, properties: {}} as Feature;
  return transformGeoJsonCoords([feature], projection.project)[0].geometry;
}

/**
 * Parse geometry buffer.
 * GeoPackage vector geometries are slightly extended past the WKB standard.
 */
function parseGeometry(geometryValue: unknown): Geometry | null {
  if (!geometryValue) {
    return null;
  }

  const arrayBuffer = getArrayBufferFromValue(geometryValue);
  const view = new DataView(arrayBuffer);
  const {envelopeLength, emptyGeometry} = parseGeometryBitFlags(view.getUint8(3));

  if (emptyGeometry) {
    return null;
  }

  const wkbOffset = 8 + envelopeLength;
  const wkbBytes = arrayBuffer.slice(wkbOffset);
  return convertWKBToGeometry(wkbBytes);
}

function parseGeometryBitFlags(byte: number): GeometryBitFlags {
  const envelopeValue = (byte & 0b00001110) / 2;
  const envelopeLength = ENVELOPE_BYTE_LENGTHS[envelopeValue] as number;

  return {
    littleEndian: Boolean(byte & 0b00000001),
    envelopeLength,
    emptyGeometry: Boolean(byte & 0b00010000),
    extendedGeometryType: Boolean(byte & 0b00100000)
  };
}

function getFeatureIdName(database: Database, tableName: string): string | null {
  const statement = database.prepare(`PRAGMA table_info(\`${tableName}\`)`);

  while (statement.step()) {
    const pragmaTableInfo = statement.getAsObject() as unknown as PragmaTableInfoRow;
    if (pragmaTableInfo.pk) {
      return pragmaTableInfo.name;
    }
  }

  return null;
}

function getDataColumns(database: Database, tableName: string): DataColumnsMapping | null {
  let statement: Statement;
  try {
    statement = database.prepare('SELECT * FROM gpkg_data_columns WHERE table_name=:tableName;');
  } catch (error) {
    if ((error as Error).message.includes('no such table')) {
      return null;
    }

    throw error;
  }

  statement.bind({':tableName': tableName});

  const dataColumns: DataColumnsMapping = {};
  while (statement.step()) {
    const column = statement.getAsObject() as unknown as DataColumnsRow;
    dataColumns[column.column_name] = column.name || null;
  }

  return dataColumns;
}

function getSchema(database: Database, tableName: string): Schema {
  const statement = database.prepare(`PRAGMA table_info(\`${tableName}\`)`);
  const fields: Field[] = [];

  while (statement.step()) {
    const pragmaTableInfo = statement.getAsObject() as unknown as PragmaTableInfoRow;
    fields.push({
      name: pragmaTableInfo.name,
      type: getSqliteFieldType(pragmaTableInfo.type),
      nullable: !pragmaTableInfo.notnull
    });
  }

  return {fields, metadata: {}};
}

function getArrowSchema(database: Database, vectorTable: GeoPackageVectorTableInfo): Schema {
  const statement = database.prepare(`PRAGMA table_info(\`${vectorTable.name}\`)`);
  const fields: Field[] = [];

  while (statement.step()) {
    const pragmaTableInfo = statement.getAsObject() as unknown as PragmaTableInfoRow;
    if (pragmaTableInfo.name === vectorTable.geometryColumnName) {
      continue;
    }
    fields.push({
      name: pragmaTableInfo.name,
      type: getSqliteFieldType(pragmaTableInfo.type),
      nullable: !pragmaTableInfo.notnull
    });
  }

  fields.push(makeWKBGeometryField(GEOMETRY_OUTPUT_COLUMN_NAME));

  const schema: Schema = {fields, metadata: {}};
  setWKBGeometrySchemaMetadata(schema, {
    geometryColumnName: GEOMETRY_OUTPUT_COLUMN_NAME,
    geometryTypes: [getGeoMetadataGeometryType(vectorTable)]
  });
  return schema;
}

function getGeoMetadataGeometryType(
  vectorTable: GeoPackageVectorTableInfo
): GeoParquetGeometryType {
  const geometryTypeNameMap: Record<GeoPackageGeometryTypes, GeoParquetGeometryType | 'Geometry'> =
    {
      GEOMETRY: 'Geometry',
      POINT: 'Point',
      LINESTRING: 'LineString',
      POLYGON: 'Polygon',
      MULTIPOINT: 'MultiPoint',
      MULTILINESTRING: 'MultiLineString',
      MULTIPOLYGON: 'MultiPolygon',
      GEOMETRYCOLLECTION: 'GeometryCollection'
    };

  const geometryType = geometryTypeNameMap[vectorTable.geometryTypeName] || 'Geometry';
  return (vectorTable.z > 0 ? `${geometryType} Z` : geometryType) as GeoParquetGeometryType;
}

function getSqliteFieldType(sqliteType: string | undefined): DataType {
  const normalizedType = (sqliteType || 'TEXT').toUpperCase() as
    | SQLiteTypes
    | GeoPackageGeometryTypes;
  return SQL_TYPE_MAPPING[normalizedType] || 'utf8';
}

function getGeoPackageBounds(row: Record<string, unknown>) {
  const minX = normalizeOptionalNumber(row.min_x);
  const minY = normalizeOptionalNumber(row.min_y);
  const maxX = normalizeOptionalNumber(row.max_x);
  const maxY = normalizeOptionalNumber(row.max_y);

  if (minX === undefined || minY === undefined || maxX === undefined || maxY === undefined) {
    return undefined;
  }

  return {minX, minY, maxX, maxY};
}

function isDefaultTableMarker(value?: string): boolean {
  if (!value) {
    return false;
  }

  const normalizedValue = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return DEFAULT_TABLE_MARKERS.has(normalizedValue);
}

function getArrayBufferFromValue(value: unknown): ArrayBuffer {
  if (value instanceof ArrayBuffer) {
    return value;
  }

  if (ArrayBuffer.isView(value)) {
    return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  }

  throw new Error('Expected GeoPackage geometry column to contain binary data.');
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length ? value : undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
