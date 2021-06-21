/* eslint-disable camelcase, @typescript-eslint/no-use-before-define */
import type {GeoPackageLoaderOptions} from '../geopackage-loader';
import initSqlJs, {SqlJsStatic, Database, Statement} from 'sql.js';
import {WKBLoader} from '@loaders.gl/wkt';
import {
  Schema,
  Field,
  DataType,
  Bool,
  Utf8,
  Float64,
  Int32,
  Int8,
  Int16,
  Float32,
  Binary
} from '@loaders.gl/schema';
import {binaryToGeoJson, transformGeoJsonCoords} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';
import {
  GeometryColumnsRow,
  ContentsRow,
  SpatialRefSysRow,
  ProjectionMapping,
  GeometryBitFlags,
  DataColumnsRow,
  DataColumnsMapping,
  PragmaTableInfoRow,
  SQLiteTypes
} from './types';

// https://www.geopackage.org/spec121/#flags_layout
const ENVELOPE_BYTE_LENGTHS = {
  0: 0,
  1: 32,
  2: 48,
  3: 48,
  4: 64,
  // values 5-7 are invalid and _should_ never show up
  5: 0,
  6: 0,
  7: 0
};

// Documentation: https://www.geopackage.org/spec130/index.html#table_column_data_types
const SQL_TYPE_MAPPING: {[type in SQLiteTypes]: typeof DataType} = {
  BOOLEAN: Bool,
  TINYINT: Int8,
  SMALLINT: Int16,
  MEDIUMINT: Int32,
  INT: Int32,
  INTEGER: Int32,
  FLOAT: Float32,
  DOUBLE: Float64,
  REAL: Float64,
  TEXT: Utf8,
  BLOB: Binary,
  DATE: Utf8,
  DATETIME: Utf8,
  GEOMETRY: Binary
};

export default async function parseGeoPackage(
  arrayBuffer: ArrayBuffer,
  options?: GeoPackageLoaderOptions
) {
  const {sqlJsCDN = 'https://sql.js.org/dist/'} = options?.geopackage || {};
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};

  const db = await loadDatabase(arrayBuffer, sqlJsCDN);
  const tables = listVectorTables(db);
  const projections = getProjections(db);

  // Mapping from tableName to geojson feature collection
  const result = {};
  for (const table of tables) {
    const {table_name: tableName} = table;
    result[tableName] = getVectorTable(db, tableName, projections, {
      reproject,
      _targetCrs
    });
  }

  return result;
}

/**
 * Initialize SQL.js and create database
 *
 * @param arrayBuffer input bytes
 * @return SQL.js database object
 */
async function loadDatabase(arrayBuffer: ArrayBuffer, sqlJsCDN: string | null): Promise<Database> {
  // In Node, `locateFile` must not be passed
  let SQL: SqlJsStatic;
  if (sqlJsCDN) {
    SQL = await initSqlJs({
      locateFile: (file) => `${sqlJsCDN}${file}`
    });
  } else {
    SQL = await initSqlJs();
  }
  return new SQL.Database(new Uint8Array(arrayBuffer));
}

/**
 * Find all vector tables in GeoPackage
 * This queries the `gpkg_contents` table to find a list of vector tables
 *
 * @param db GeoPackage to query
 * @return list of table references
 */
function listVectorTables(db: Database): ContentsRow[] {
  // The gpkg_contents table can have at least three categorical values for
  // data_type.
  // - 'features' refers to a vector geometry table
  // (https://www.geopackage.org/spec121/#_contents_2)
  // - 'tiles' refers to a raster table
  // (https://www.geopackage.org/spec121/#_contents_3)
  // - 'attributes' refers to a data table with no geometry
  // (https://www.geopackage.org/spec121/#_contents_4).

  // We hard code 'features' because for now we don't support raster data or pure attribute data
  // eslint-disable-next-line quotes
  const stmt = db.prepare("SELECT * FROM gpkg_contents WHERE data_type='features';");

  const vectorTablesInfo: ContentsRow[] = [];
  while (stmt.step()) {
    const vectorTableInfo = stmt.getAsObject() as unknown as ContentsRow;
    vectorTablesInfo.push(vectorTableInfo);
  }

  return vectorTablesInfo;
}

/**
 * Load geometries from vector table
 *
 * @param db GeoPackage object
 * @param tableName name of vector table to query
 * @param projections keys are srs_id values, values are WKT strings
 * @returns Array of GeoJSON Feature objects
 */
function getVectorTable(
  db: Database,
  tableName: string,
  projections: ProjectionMapping,
  {reproject, _targetCrs}: {reproject: boolean; _targetCrs: string}
): object {
  const dataColumns = getDataColumns(db, tableName);
  const geomColumn = getGeometryColumn(db, tableName);
  const featureIdColumn = getFeatureIdName(db, tableName);

  // Get vector features from table
  // Don't think it's possible to parameterize the table name in SQLite?
  const {columns, values} = db.exec(`SELECT * FROM \`${tableName}\`;`)[0];

  let projection;
  if (reproject) {
    const geomColumnProjStr = projections[geomColumn.srs_id];
    projection = new Proj4Projection({
      from: geomColumnProjStr,
      to: _targetCrs
    });
  }

  const geojsonFeatures: object[] = [];
  for (const row of values) {
    const geojsonFeature = constructGeoJsonFeature(
      columns,
      row,
      geomColumn,
      // @ts-ignore
      dataColumns,
      featureIdColumn
    );
    geojsonFeatures.push(geojsonFeature);
  }

  const schema = getArrowSchema(db, tableName);
  if (projection) {
    return {geojsonFeatures: transformGeoJsonCoords(geojsonFeatures, projection.project), schema};
  }

  return {geojsonFeatures, schema};
}

/**
 * Find all projections defined in GeoPackage
 * This queries the gpkg_spatial_ref_sys table
 * @param db GeoPackage object
 * @returns mapping from srid to WKT projection string
 */
function getProjections(db: Database): ProjectionMapping {
  // Query gpkg_spatial_ref_sys to get srid: srtext mappings
  const stmt = db.prepare('SELECT * FROM gpkg_spatial_ref_sys;');

  const projectionMapping: ProjectionMapping = {};
  while (stmt.step()) {
    const srsInfo = stmt.getAsObject() as unknown as SpatialRefSysRow;
    const {srs_id, definition} = srsInfo;
    projectionMapping[srs_id] = definition;
  }

  return projectionMapping;
}

/**
 * Construct single GeoJSON feature given row's data
 * @param columns array of ordered column identifiers
 * @param row array of ordered values representing row's data
 * @param geomColumn geometry column metadata
 * @param dataColumns mapping from table column names to property name
 * @returns GeoJSON Feature object
 */
function constructGeoJsonFeature(
  columns: string[],
  row: any[],
  geomColumn: GeometryColumnsRow,
  dataColumns: DataColumnsMapping,
  featureIdColumn: string
) {
  // Find feature id
  const idIdx = columns.indexOf(featureIdColumn);
  const id = row[idIdx];

  // Parse geometry columns to geojson
  const geomColumnIdx = columns.indexOf(geomColumn.column_name);
  const geometry = parseGeometry(row[geomColumnIdx].buffer);

  const properties = {};
  if (dataColumns) {
    for (const [key, value] of Object.entries(dataColumns)) {
      const idx = columns.indexOf(key);
      // @ts-ignore TODO - Check what happens if null?
      properties[value] = row[idx];
    }
  } else {
    // Put all columns except for the feature id and geometry in properties
    for (let i = 0; i < columns.length; i++) {
      if (i === idIdx || i === geomColumnIdx) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const columnName = columns[i];
      properties[columnName] = row[i];
    }
  }

  return {
    id,
    type: 'Feature',
    geometry,
    properties
  };
}

/**
 * Get GeoPackage version from database
 * @param db database
 * @returns version string. One of '1.0', '1.1', '1.2'
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getGeopackageVersion(db: Database): string | null {
  const textDecoder = new TextDecoder();

  // Read application id from SQLite metadata
  const applicationIdQuery = db.exec('PRAGMA application_id;')[0];
  const applicationId = applicationIdQuery.values[0][0];

  // Convert 4-byte signed int32 application id to text
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, Number(applicationId));
  const versionString = textDecoder.decode(buffer);

  if (versionString === 'GP10') {
    return '1.0';
  }

  if (versionString === 'GP11') {
    return '1.1';
  }

  // If versionString is GPKG, then read user_version
  const userVersionQuery = db.exec('PRAGMA user_version;')[0];
  const userVersionInt = userVersionQuery.values[0][0];

  if (userVersionInt && userVersionInt < 10300) {
    return '1.2';
  }

  return null;
}

/**
 * Find name of feature id column in table
 * The feature ID is the primary key of the table.
 * http://www.geopackage.org/spec121/#feature_user_tables
 *
 * @param db database
 * @param tableName name of table
 * @return name of feature id column
 */
function getFeatureIdName(db: Database, tableName: string): string | null {
  // Again, not possible to parameterize table name?
  const stmt = db.prepare(`PRAGMA table_info(\`${tableName}\`)`);

  while (stmt.step()) {
    const pragmaTableInfo = stmt.getAsObject() as unknown as PragmaTableInfoRow;
    const {name, pk} = pragmaTableInfo;
    if (pk) {
      return name;
    }
  }

  // Is it guaranteed for there always to be at least one primary key column in the table?
  return null;
}

/**
 * Parse geometry buffer
 * GeoPackage vector geometries are slightly extended past the WKB standard
 * See: https://www.geopackage.org/spec121/#gpb_format
 *
 * @param arrayBuffer geometry buffer
 * @return {object} GeoJSON geometry (in original CRS)
 */
function parseGeometry(arrayBuffer: ArrayBuffer) {
  const view = new DataView(arrayBuffer);
  const {envelopeLength, emptyGeometry} = parseGeometryBitFlags(view.getUint8(3));

  // A Feature object has a member with the name "geometry".  The value of the
  // geometry member SHALL be either a Geometry object as defined above or, in
  // the case that the Feature is unlocated, a JSON null value.
  // https://tools.ietf.org/html/rfc7946#section-3.2
  if (emptyGeometry) {
    return null;
  }

  // Do I need to find the srid here? Is it necessarily the same for every
  // geometry in a table?
  // const srid = view.getInt32(4, littleEndian);

  // 2 byte magic, 1 byte version, 1 byte flags, 4 byte int32 srid
  const wkbOffset = 8 + envelopeLength;

  // Loaders should not depend on `core` and the context passed to the main loader doesn't include a
  // `parseSync` option, so instead we call parseSync directly on WKBLoader
  const binaryGeometry = WKBLoader.parseSync(arrayBuffer.slice(wkbOffset));

  return binaryToGeoJson(binaryGeometry);
}

/**
 * Parse geometry header flags
 * https://www.geopackage.org/spec121/#flags_layout
 *
 * @param byte uint8 number representing flags
 * @return object representing information from bit flags
 */
function parseGeometryBitFlags(byte: number): GeometryBitFlags {
  // Are header values little endian?
  const envelopeValue = (byte & 0b00001110) / 2;

  // TODO: Not sure the best way to handle this. Throw an error if envelopeValue outside 0-7?
  const envelopeLength = ENVELOPE_BYTE_LENGTHS[envelopeValue] as number;

  return {
    littleEndian: Boolean(byte & 0b00000001),
    envelopeLength,
    emptyGeometry: Boolean(byte & 0b00010000),
    extendedGeometryType: Boolean(byte & 0b00100000)
  };
}

/**
 * Find geometry column in given vector table
 *
 * @param db GeoPackage object
 * @param tableName Name of vector table
 * @returns Array of geometry column definitions
 */
function getGeometryColumn(db: Database, tableName: string): GeometryColumnsRow {
  const stmt = db.prepare('SELECT * FROM gpkg_geometry_columns WHERE table_name=:tableName;');
  stmt.bind({':tableName': tableName});

  // > Requirement 30
  // > A feature table SHALL have only one geometry column.
  // https://www.geopackage.org/spec121/#feature_user_tables
  // So we should need one and only one step, given that we use the WHERE clause in the SQL query
  // above
  stmt.step();
  const geometryColumn = stmt.getAsObject() as unknown as GeometryColumnsRow;
  return geometryColumn;
}

/**
 * Find property columns in given vector table
 * @param db GeoPackage object
 * @param tableName Name of vector table
 * @returns Mapping from table column names to property name
 */
function getDataColumns(db: Database, tableName: string): DataColumnsMapping | null {
  // gpkg_data_columns is not required to exist
  // https://www.geopackage.org/spec121/#extension_schema
  let stmt: Statement;
  try {
    stmt = db.prepare('SELECT * FROM gpkg_data_columns WHERE table_name=:tableName;');
  } catch (error) {
    if (error.message.includes('no such table')) {
      return null;
    }

    throw error;
  }

  stmt.bind({':tableName': tableName});

  // Convert DataColumnsRow object this to a key-value {column_name: name}
  const result: DataColumnsMapping = {};
  while (stmt.step()) {
    const column = stmt.getAsObject() as unknown as DataColumnsRow;
    const {column_name, name} = column;
    result[column_name] = name || null;
  }

  return result;
}

/**
 * Get arrow schema
 * @param db GeoPackage object
 * @param tableName  table name
 * @returns Arrow-like Schema
 */
function getArrowSchema(db: Database, tableName: string): Schema {
  const stmt = db.prepare(`PRAGMA table_info(\`${tableName}\`)`);

  const fields: Field[] = [];
  while (stmt.step()) {
    const pragmaTableInfo = stmt.getAsObject() as unknown as PragmaTableInfoRow;
    const {name, type, notnull} = pragmaTableInfo;
    const field = new Field(name, new SQL_TYPE_MAPPING[type](), !notnull);
    fields.push(field);
  }

  return new Schema(fields);
}
