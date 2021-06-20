/* eslint-disable camelcase */
export interface GeometryBitFlags {
  littleEndian: boolean;
  envelopeLength: number;
  emptyGeometry: boolean;
  extendedGeometryType: boolean;
}

export type ProjectionMapping = {[srsId: number]: string};
export type DataColumnsMapping = {[columnName: string]: string | null};
export type SQLiteTypes =
  | 'BOOLEAN'
  | 'TINYINT'
  | 'SMALLINT'
  | 'MEDIUMINT'
  | 'INT'
  | 'INTEGER'
  | 'FLOAT'
  | 'DOUBLE'
  | 'REAL'
  | 'TEXT'
  | 'BLOB'
  | 'DATE'
  | 'DATETIME'
  | 'GEOMETRY';

/**
 * https://www.geopackage.org/spec121/#spatial_ref_sys
 */
export interface SpatialRefSysRow {
  /**
   * Human readable name of this SRS
   */
  srs_name: string;

  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   */
  srs_id: number;

  /**
   * Case-insensitive name of the defining organization e.g. EPSG or epsg
   */
  organization: string;

  /**
   * Numeric ID of the Spatial Reference System assigned by the organization
   */
  organization_coordsys_id: number;

  /**
   * Well-known Text [A32] Representation of the Spatial Reference System
   */
  definition: string;

  /**
   * Human readable description of this SRS
   */
  description?: string;
}

/**
 * https://www.geopackage.org/spec121/#_contents
 */
export interface ContentsRow {
  /**
   * The name of the actual content (e.g., tiles, features, or attributes) table
   */
  table_name: string;

  /**
   * Type of data stored in the table
   */
  data_type: 'features' | 'attributes' | 'tiles';

  /**
   * A human-readable identifier (e.g. short name) for the table_name content
   */
  identifier?: string;

  /**
   * A human-readable description for the table_name content
   */
  description?: string;

  /**
   * timestamp of last change to content, in ISO 8601 format
   */
  last_change: string;

  /**
   * Bounding box minimum easting or longitude for all content in table_name. If tiles, this is informational and the tile matrix set should be used for calculating tile coordinates.
   */
  min_x?: number;

  /**
   * Bounding box minimum northing or latitude for all content in table_name. If tiles, this is informational and the tile matrix set should be used for calculating tile coordinates.
   */
  min_y?: number;
  /**
   * Bounding box maximum easting or longitude for all content in table_name. If tiles, this is informational and the tile matrix set should be used for calculating tile coordinates.
   */
  max_x?: number;

  /**
   * Bounding box maximum northing or latitude for all content in table_name. If tiles, this is informational and the tile matrix set should be used for calculating tile coordinates.
   */
  max_y?: number;

  /**
   * Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id; when data_type is features, SHALL also match gpkg_geometry_columns.srs_id; When data_type is tiles, SHALL also match gpkg_tile_matrix_set.srs_id
   */
  srs_id?: number;
}

// https://www.geopackage.org/spec121/#geometry_types_extension
type GeometryType =
  | 'GEOMETRY'
  | 'POINT'
  | 'LINESTRING'
  | 'POLYGON'
  | 'MULTIPOINT'
  | 'MULTILINESTRING'
  | 'MULTIPOLYGON'
  | 'GEOMETRYCOLLECTION'
  | 'CIRCULARSTRING'
  | 'COMPOUNDCURVE'
  | 'CURVEPOLYGON'
  | 'MULTICURVE'
  | 'MULTISURFACE'
  | 'CURVE'
  | 'SURFACE';

/**
 * https://www.geopackage.org/spec121/#_geometry_columns
 */
export interface GeometryColumnsRow {
  /**
   * Name of the table containing the geometry column
   */
  table_name: string;

  /**
   * Name of a column in the feature table that is a Geometry Column
   */
  column_name: string;

  /**
   * Name from Geometry Type Codes (Core) or Geometry Type Codes (Extension) in Geometry Types (Normative)
   */
  geometry_type_name: GeometryType;

  /**
   * Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id
   */
  srs_id: number;

  /**
   * 0: z values prohibited; 1: z values mandatory; 2: z values optional
   */
  z: 0 | 1 | 2;

  /**
   * 0: m values prohibited; 1: m values mandatory; 2: m values optional
   */
  m: 0 | 1 | 2;
}

/**
 * https://www.geopackage.org/spec121/#extensions_table_definition
 */
export interface ExtensionsRow {
  /**
   * Name of the table that requires the extension. When NULL, the extension is required for the entire GeoPackage. SHALL NOT be NULL when the column_name is not NULL.
   */
  table_name?: string;

  /**
   * Name of the column that requires the extension. When NULL, the extension is required for the entire table.
   */
  column_name?: string;

  /**
   * The case sensitive name of the extension that is required, in the form <author>_<extension_name>.
   */
  extension_name: string;

  /**
   * Permalink, URI, or reference to a document that defines the extension
   */
  definition: string;

  /**
   * Indicates scope of extension effects on readers / writers: 'read-write' or 'write-only' in lowercase.
   */
  scope: string;
}

/**
 * https://www.geopackage.org/spec121/#gpkg_data_columns_cols
 */
export interface DataColumnsRow {
  /**
   * Name of the tiles or feature table
   */
  table_name: string;

  /**
   * Name of the table column
   */
  column_name: string;

  /**
   * A human-readable identifier (e.g. short name) for the column_name content
   */
  name?: string;

  /**
   * A human-readable formal title for the column_name content
   */
  title?: string;

  /**
   * A human-readable description for the column_name content
   */
  description?: string;

  /**
   * MIME [A21] type of column_name if BLOB type, or NULL for other types
   */
  mime_type?: string;

  /**
   * Column value constraint name (lowercase) specified by reference to gpkg_data_column_constraints.constraint name
   */
  constraint_name?: string;
}

/**
 * Type for PRAGMA table_info(tableName);
 */
export interface PragmaTableInfoRow {
  cid: number;
  name: string;
  type: SQLiteTypes;
  notnull: 0 | 1;
  dflt_value: any;
  pk: 0 | 1;
}
