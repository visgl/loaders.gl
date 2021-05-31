/** @typedef {import('sql.js').Database} Database */

import initSqlJs from 'sql.js';
import {WKBLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';
import {binaryToGeoJson, transformGeoJsonCoords} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';

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

export default async function parseGeoPackage(arrayBuffer, options) {
  const {sqlJsCDN} = (options && options.geopackage) || {};
  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const db = await loadDatabase(arrayBuffer, {sqlJsCDN});
  const tables = listVectorTables(db);
  const projections = getProjections(db);

  // Mapping from tableName to geojson feature collection
  const result = {};
  for (const table of tables) {
    const {table_name: tableName} = table;
    result[tableName] = getVectorTable(db, tableName, projections, {reproject, _targetCrs});
  }

  return result;
}

/**
 * Initialize SQL.js and create database
 *
 * @param  {ArrayBuffer} arrayBuffer input bytes
 * @return {Promise<Database>} SQL.js database object
 */
async function loadDatabase(arrayBuffer, {sqlJsCDN}) {
  // In Node, `locateFile` must not be passed
  let SQL;
  if (sqlJsCDN) {
    SQL = await initSqlJs({
      locateFile: file => `${sqlJsCDN}${file}`
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
 * @param  {Database} db GeoPackage to query
 * @return {object[]} list of table references
 */
function listVectorTables(db) {
  // The gpkg_contents table can have at least three categorical values for
  // data_type.
  // - 'features' refers to a vector geometry table
  // (https://www.geopackage.org/spec121/#_contents_2)
  // - 'tiles' refers to a raster table
  // (https://www.geopackage.org/spec121/#_contents_3)
  // - 'attributes' refers to a data table with no geometry
  // (https://www.geopackage.org/spec121/#_contents_4).
  const {columns, values} = db.exec("SELECT * FROM gpkg_contents WHERE data_type = 'features';")[0];

  return interleaveResults(columns, values);
}

/**
 * Load geometries from vector table
 *
 * @param  {Database} db GeoPackage object
 * @param  {string} tableName name of vector table to query
 * @param  {object} projections keys are srs_id values, values are WKT strings
 * @return {object[]} array of GeoJSON Feature objects
 */
function getVectorTable(db, tableName, projections, {reproject, _targetCrs}) {
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

  const geojsonFeatures = [];
  for (const row of values) {
    const geojsonFeature = constructGeoJsonFeature(
      columns,
      row,
      geomColumn,
      dataColumns,
      featureIdColumn
    );
    geojsonFeatures.push(geojsonFeature);
  }

  if (projection) {
    return transformGeoJsonCoords(geojsonFeatures, projection.project);
  }

  return geojsonFeatures;
}

/**
 * Find all projections defined in GeoPackage
 * This queries the gpkg_spatial_ref_sys table
 *
 * @param  {Database} db GeoPackage object
 * @return {object} mapping from srid to WKT projection string
 */
function getProjections(db) {
  // Query gpkg_spatial_ref_sys to get srid: srtext mappings
  const {columns, values} = db.exec('SELECT * FROM gpkg_spatial_ref_sys;')[0];
  const srsIdIdx = columns.indexOf('srs_id');
  const definitionIdx = columns.indexOf('definition');

  const result = {};
  for (const row of values) {
    if (row[definitionIdx] !== 'undefined') {
      result[row[srsIdIdx]] = row[definitionIdx];
    }
  }

  return result;
}

/**
 * Construct single GeoJSON feature given row's data
 *
 * @param  {string[]} columns array of ordered column identifiers
 * @param  {any[]} row array of ordered values representing row's data
 * @param  {object} geomColumn geometry column metadata
 * @param  {object} dataColumns mapping from table column names to property name
 * @return {object} GeoJSON Feature object
 */
function constructGeoJsonFeature(columns, row, geomColumn, dataColumns, featureIdColumn) {
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
 *
 * @param  {Database} db database
 * @return {string?}    version string. One of '1.0', '1.1', '1.2'
 */
// eslint-disable-next-line no-unused-vars
function getGeopackageVersion(db) {
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
 * http://www.geopackage.org/spec/#feature_user_tables
 *
 * @param  {Database} db database
 * @param  {string} tableName name of table
 * @return {string}           name of feature id column
 */
function getFeatureIdName(db, tableName) {
  // Again, not possible to parameterize table name?
  const {columns, values} = db.exec(`PRAGMA table_info(\`${tableName}\`)`)[0];

  const primaryKeyIdx = columns.indexOf('pk');
  const primaryKey = values.filter(row => row[primaryKeyIdx] === 1)[0];

  // I _think_ there is supposed to be only one column forming the primary key,
  // and that is the feature id.
  const columnNameIdx = columns.indexOf('name');
  return primaryKey[String(columnNameIdx)];
}

/**
 * Parse geometry buffer
 * GeoPackage vector geometries are slightly extended past the WKB standard
 * See: https://www.geopackage.org/spec121/#gpb_format
 *
 * @param  {ArrayBuffer} arrayBuffer geometry buffer
 * @return {object} GeoJSON geometry (in original CRS)
 */
function parseGeometry(arrayBuffer) {
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
  const binaryGeometry = parseSync(arrayBuffer.slice(wkbOffset), WKBLoader);

  return binaryToGeoJson(binaryGeometry);
}

/**
 * Parse geometry header flags
 * https://www.geopackage.org/spec121/#flags_layout
 *
 * @param  {number} byte uint8 number representing flags
 * @return {object}      object representing information from bit flags
 */
function parseGeometryBitFlags(byte) {
  // Are header values little endian?
  const envelopeValue = (byte & 0b00001110) / 2;

  return {
    littleEndian: Boolean(byte & 0b00000001),
    envelopeLength: ENVELOPE_BYTE_LENGTHS[envelopeValue],
    emptyGeometry: Boolean(byte & 0b00010000),
    extendedGeometryType: Boolean(byte & 0b00100000)
  };
}

/**
 * Find geometry column in given vector table
 *
 * @param  {Database} db GeoPackage object
 * @param  {string} tableName Name of vector table
 * @return {object} Array of geometry column definitions
 */
function getGeometryColumn(db, tableName) {
  const stmt = db.prepare('SELECT * FROM gpkg_geometry_columns WHERE table_name=:tableName;');

  stmt.bind({':tableName': tableName});
  const columns = [];
  while (stmt.step()) {
    columns.push(stmt.getAsObject());
  }

  // > Requirement 30
  // > A feature table SHALL have only one geometry column.
  // https://www.geopackage.org/spec121/#feature_user_tables
  return columns[0];
}

/**
 * Find property columns in given vector table
 *
 * @param  {Database} db GeoPackage object
 * @param  {string} tableName Name of vector table
 * @return {object?} Mapping from table column names to property name
 */
function getDataColumns(db, tableName) {
  // gpkg_data_columns is not required to exist
  // https://www.geopackage.org/spec121/#extension_schema
  let stmt;
  try {
    stmt = db.prepare('SELECT * FROM gpkg_data_columns WHERE table_name=:tableName;');
  } catch (error) {
    if (error.message.includes('no such table')) {
      return null;
    }

    throw error;
  }

  stmt.bind({':tableName': tableName});

  // Each column object is
  // {
  //  table_name:
  //  column_name:
  //  name:
  //  ...
  // }
  // Change this to a key-value column_name: name
  const result = {};
  while (stmt.step()) {
    const column = stmt.getAsObject();
    const {column_name: columnName, name} = column;
    result[columnName] = name;
  }

  return result;
}

/**
 * Merge columns and values together to an array of objects
 *
 * @param  {string[]} columns array representing column names
 * @param  {any[][]} values  an array of arrays, where each inner array represents one row
 * @return {object[]} an array of objects, where each object represents a single row
 */
function interleaveResults(columns, values) {
  const merged = [];
  for (const value of values) {
    const result = {};
    columns.forEach((column, i) => (result[column] = value[i]));
    merged.push(result);
  }

  return merged;
}
