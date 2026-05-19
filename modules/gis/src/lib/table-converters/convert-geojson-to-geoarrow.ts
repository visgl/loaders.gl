// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrowTable,
  Feature,
  FeatureCollection,
  Field,
  Geometry,
  GeoJsonProperties,
  GeoJSONTable,
  Schema
} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {convertGeometryToWKT} from '../geometry-converters/wkb/convert-geometry-to-wkt';
import {
  encodeWKBGeometryValue,
  inferGeoParquetGeometryTypes,
  makeWKBGeometryField,
  setWKBGeometrySchemaMetadata
} from '../geoarrow/wkb-geoarrow-utils';
import {
  getGeoMetadata,
  setGeoMetadata,
  type GeoColumnMetadata
} from '../geoarrow/geoparquet-metadata';

const DEFAULT_GEOMETRY_COLUMN_NAME = 'geometry';
const DEFAULT_GEO_METADATA_VERSION = '1.1.0';
const GEOJSON_CRS_METADATA_KEY = 'geojson_crs';
const GEOARROW_EXTENSION_METADATA_KEY = 'ARROW:extension:metadata';

const CRS84_PROJJSON = {
  $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
  type: 'GeographicCRS',
  name: 'WGS 84 longitude-latitude',
  datum_ensemble: {
    name: 'World Geodetic System 1984 ensemble',
    members: [
      {name: 'World Geodetic System 1984 (Transit)'},
      {name: 'World Geodetic System 1984 (G730)'},
      {name: 'World Geodetic System 1984 (G873)'},
      {name: 'World Geodetic System 1984 (G1150)'},
      {name: 'World Geodetic System 1984 (G1674)'},
      {name: 'World Geodetic System 1984 (G1762)'},
      {name: 'World Geodetic System 1984 (G2139)'}
    ],
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    },
    accuracy: '2.0',
    id: {
      authority: 'EPSG',
      code: 6326
    }
  },
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {
        name: 'Geodetic longitude',
        abbreviation: 'Lon',
        direction: 'east',
        unit: 'degree'
      },
      {
        name: 'Geodetic latitude',
        abbreviation: 'Lat',
        direction: 'north',
        unit: 'degree'
      }
    ]
  },
  id: {
    authority: 'OGC',
    code: 'CRS84'
  }
};

const EPSG_4326_PROJJSON = {
  ...CRS84_PROJJSON,
  name: 'WGS 84',
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {
        name: 'Geodetic latitude',
        abbreviation: 'Lat',
        direction: 'north',
        unit: 'degree'
      },
      {
        name: 'Geodetic longitude',
        abbreviation: 'Lon',
        direction: 'east',
        unit: 'degree'
      }
    ]
  },
  id: {
    authority: 'EPSG',
    code: 4326
  }
};

/** Supported GeoArrow encodings for GeoJSON feature conversion. */
export type GeoJSONToGeoArrowEncoding = 'wkb' | 'wkt';

/** Legacy GeoJSON CRS object from pre-RFC 7946 GeoJSON documents. */
export type LegacyGeoJSONCRS = {
  /** Legacy CRS descriptor type, commonly `name` or `link`. */
  type?: string;
  /** Legacy CRS descriptor properties. */
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Options for converting GeoJSON features to a GeoArrow-compatible Arrow table. */
export type GeoJSONToGeoArrowOptions = {
  /** Geometry column name to write into Arrow output. */
  geometryColumnName?: string;
  /** Geometry encoding to use for the output geometry column. */
  encoding?: GeoJSONToGeoArrowEncoding;
  /** Optional legacy GeoJSON root CRS metadata to preserve on the geometry column. */
  crs?: LegacyGeoJSONCRS | null;
};

/** Returns true when a value is a GeoJSON FeatureCollection. */
export function isGeoJSONFeatureCollection(value: unknown): value is FeatureCollection {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (value as {type?: unknown}).type === 'FeatureCollection' &&
    Array.isArray((value as {features?: unknown}).features)
  );
}

/** Returns true when a value is an array of GeoJSON Feature objects. */
export function isGeoJSONFeatureArray(value: unknown): value is Feature[] {
  return Array.isArray(value) && value.length > 0 && value.every(isGeoJSONFeature);
}

/** Converts a GeoJSON feature collection table to a loaders.gl Arrow table with GeoArrow metadata. */
export function convertFeatureCollectionToGeoArrowTable(
  table: GeoJSONTable,
  options?: GeoJSONToGeoArrowOptions
): ArrowTable {
  return convertFeaturesToGeoArrowTable(table.features, {
    ...options,
    crs: options?.crs ?? (table as {crs?: LegacyGeoJSONCRS | null}).crs
  });
}

/** Converts GeoJSON features into a loaders.gl Arrow table with GeoArrow metadata. */
export function convertFeaturesToGeoArrowTable(
  features: Feature[],
  options?: GeoJSONToGeoArrowOptions
): ArrowTable {
  const rows = makeGeoArrowFeatureRows(features, options);
  const schema = makeGeoArrowFeatureSchema(features, options);
  const arrowTableBuilder = new ArrowTableBuilder(schema);

  for (const row of rows) {
    arrowTableBuilder.addObjectRow(row);
  }

  return arrowTableBuilder.finishTable();
}

/** Builds object rows from GeoJSON features with properties flattened and geometry encoded. */
export function makeGeoArrowFeatureRows(
  features: Feature[],
  options?: GeoJSONToGeoArrowOptions
): Record<string, unknown>[] {
  const geometryColumnName = options?.geometryColumnName || DEFAULT_GEOMETRY_COLUMN_NAME;
  const encoding = options?.encoding || 'wkb';

  return features.map(feature => {
    const properties = normalizeProperties(feature.properties);
    assertNoGeometryPropertyCollision(properties, geometryColumnName);

    return {
      ...properties,
      [geometryColumnName]: encodeGeoArrowGeometry(feature.geometry, encoding)
    };
  });
}

/** Builds a loaders.gl schema for GeoJSON feature rows with GeoArrow geometry metadata. */
export function makeGeoArrowFeatureSchema(
  features: Feature[],
  options?: GeoJSONToGeoArrowOptions
): Schema {
  const geometryColumnName = options?.geometryColumnName || DEFAULT_GEOMETRY_COLUMN_NAME;
  const encoding = options?.encoding || 'wkb';
  const propertyRows = features.map(feature => {
    const properties = normalizeProperties(feature.properties);
    assertNoGeometryPropertyCollision(properties, geometryColumnName);
    return properties;
  });
  const propertySchema = getPropertySchema(propertyRows);
  const geometryField: Field =
    encoding === 'wkb'
      ? makeWKBGeometryField(geometryColumnName, true)
      : {
          name: geometryColumnName,
          type: 'utf8',
          nullable: true,
          metadata: {}
        };
  const schema: Schema = {
    fields: [...propertySchema.fields, geometryField],
    metadata: {...(propertySchema.metadata || {})}
  };

  if (encoding === 'wkb') {
    setWKBGeometrySchemaMetadata(schema, {
      geometryColumnName,
      primaryColumnName: geometryColumnName,
      geometryTypes: inferGeoParquetGeometryTypes(features.map(feature => feature.geometry))
    });
  } else {
    schema.metadata!.geo = JSON.stringify({
      version: DEFAULT_GEO_METADATA_VERSION,
      primary_column: geometryColumnName,
      columns: {
        [geometryColumnName]: {
          encoding,
          geometry_types: inferGeoParquetGeometryTypes(features.map(feature => feature.geometry))
        }
      }
    });
  }

  applyLegacyGeoJSONCRSToSchema(schema, geometryColumnName, options?.crs);

  return schema;
}

/**
 * Applies legacy GeoJSON CRS metadata to a GeoArrow schema.
 *
 * Arbitrary CRS values are preserved under `geojson_crs`; recognized WGS84 names are also mapped
 * into GeoArrow/GeoParquet CRS metadata for consumers that understand GeoArrow CRS fields.
 */
export function applyLegacyGeoJSONCRSToSchema(
  schema: Schema,
  geometryColumnName: string,
  crs: LegacyGeoJSONCRS | null | undefined
): Schema {
  if (!isLegacyGeoJSONCRS(crs)) {
    return schema;
  }

  const geometryField = schema.fields.find(field => field.name === geometryColumnName);
  if (!geometryField) {
    return schema;
  }

  const normalizedCRS = normalizeLegacyGeoJSONCRS(crs);
  const columnMetadata: Partial<GeoColumnMetadata> = {
    [GEOJSON_CRS_METADATA_KEY]: crs
  };

  if (normalizedCRS) {
    columnMetadata.crs = normalizedCRS.projjson;
    columnMetadata.crs_type = 'projjson';
  }

  schema.metadata ||= {};
  const geoMetadata = getGeoMetadata(schema.metadata) || {
    version: DEFAULT_GEO_METADATA_VERSION,
    primary_column: geometryColumnName,
    columns: {}
  };
  geoMetadata.version ||= DEFAULT_GEO_METADATA_VERSION;
  geoMetadata.primary_column ||= geometryColumnName;
  geoMetadata.columns ||= {};
  const existingColumnMetadata = geoMetadata.columns[geometryColumnName] || {
    encoding: geometryField.type === 'utf8' ? 'wkt' : 'wkb',
    geometry_types: []
  };
  geoMetadata.columns[geometryColumnName] = {
    ...existingColumnMetadata,
    ...columnMetadata
  } as GeoColumnMetadata;
  setGeoMetadata(schema.metadata, geoMetadata);

  geometryField.metadata ||= {};
  const extensionMetadata = parseExtensionMetadata(
    geometryField.metadata[GEOARROW_EXTENSION_METADATA_KEY]
  );
  extensionMetadata[GEOJSON_CRS_METADATA_KEY] = crs;
  if (normalizedCRS) {
    extensionMetadata.crs = normalizedCRS.projjson;
    extensionMetadata.crs_type = 'projjson';
  }
  geometryField.metadata[GEOARROW_EXTENSION_METADATA_KEY] = JSON.stringify(extensionMetadata);

  return schema;
}

/** Returns true when a value is a GeoJSON Feature object. */
function isGeoJSONFeature(value: unknown): value is Feature {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as {type?: unknown}).type === 'Feature' &&
    'geometry' in value &&
    'properties' in value
  );
}

/** Encodes one GeoJSON geometry value using the requested GeoArrow geometry encoding. */
function encodeGeoArrowGeometry(
  geometry: Geometry | null | undefined,
  encoding: GeoJSONToGeoArrowEncoding
): Uint8Array | string | null {
  if (!geometry) {
    return null;
  }

  return encoding === 'wkt' ? convertGeometryToWKT(geometry) : encodeWKBGeometryValue(geometry);
}

/** Normalizes GeoJSON properties to primitive values that can be written to Arrow. */
function normalizeProperties(properties: GeoJsonProperties): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const normalizedProperties: Record<string, unknown> = {};
  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    normalizedProperties[propertyName] = normalizePropertyValue(propertyValue);
  }
  return normalizedProperties;
}

/** Normalizes one GeoJSON property value to a primitive Arrow-compatible value. */
function normalizePropertyValue(propertyValue: unknown): unknown {
  if (
    propertyValue === null ||
    propertyValue === undefined ||
    typeof propertyValue === 'string' ||
    typeof propertyValue === 'number' ||
    typeof propertyValue === 'boolean'
  ) {
    return propertyValue ?? null;
  }

  if (propertyValue instanceof Date) {
    return propertyValue.toISOString();
  }

  return JSON.stringify(propertyValue);
}

/** Infers a primitive Arrow schema for flattened GeoJSON feature properties. */
function getPropertySchema(propertyRows: Record<string, unknown>[]): Schema {
  if (propertyRows.length === 0) {
    return {fields: [], metadata: {}};
  }

  const fieldNames = getFieldNames(propertyRows);
  return {
    metadata: {},
    fields: fieldNames.map((fieldName): Field => {
      const inferredType = getPropertyFieldType(
        propertyRows.map(propertyRow => propertyRow[fieldName])
      );
      return {
        name: fieldName,
        type: inferredType.type === 'float32' ? 'float64' : inferredType.type,
        nullable: inferredType.nullable
      };
    })
  };
}

/** Infers one primitive property field type while skipping missing nullable values. */
function getPropertyFieldType(values: unknown[]): {type: Field['type']; nullable: boolean} {
  let type: Field['type'] = 'null';
  let nullable = false;

  for (const value of values) {
    if (value === null || value === undefined) {
      nullable = true;
      continue;
    }

    const valueType = getPropertyValueType(value);
    if (type === 'null') {
      type = valueType;
      continue;
    }

    if (type !== valueType) {
      throw new Error(`GeoJSONLoader: incompatible property types ${type} and ${valueType}`);
    }
  }

  return {type, nullable};
}

/** Infers the primitive Arrow type used for one normalized GeoJSON property value. */
function getPropertyValueType(value: unknown): Field['type'] {
  switch (typeof value) {
    case 'boolean':
      return 'bool';
    case 'number':
      return 'float64';
    case 'string':
      return 'utf8';
    default:
      return 'null';
  }
}

/** Returns true when a value is a legacy GeoJSON CRS object. */
function isLegacyGeoJSONCRS(value: unknown): value is LegacyGeoJSONCRS {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Normalizes recognized legacy GeoJSON CRS names to GeoArrow-compatible CRS metadata. */
function normalizeLegacyGeoJSONCRS(
  crs: LegacyGeoJSONCRS
): {name: string; projjson: Record<string, unknown>} | null {
  const name = getLegacyGeoJSONCRSName(crs);
  if (!name) {
    return null;
  }

  const normalizedName = name.toLowerCase();
  if (
    normalizedName === 'crs84' ||
    normalizedName === 'ogc:crs84' ||
    normalizedName === 'urn:ogc:def:crs:ogc:1.3:crs84' ||
    normalizedName === 'urn:ogc:def:crs:ogc::crs84' ||
    normalizedName === 'http://www.opengis.net/def/crs/ogc/1.3/crs84'
  ) {
    return {name, projjson: cloneJSON(CRS84_PROJJSON)};
  }

  if (
    normalizedName === 'epsg:4326' ||
    normalizedName === 'urn:ogc:def:crs:epsg::4326' ||
    normalizedName === 'urn:ogc:def:crs:epsg:6.6:4326' ||
    normalizedName === 'http://www.opengis.net/def/crs/epsg/0/4326'
  ) {
    return {name, projjson: cloneJSON(EPSG_4326_PROJJSON)};
  }

  return null;
}

/** Extracts a legacy GeoJSON CRS name from `name` CRS objects. */
function getLegacyGeoJSONCRSName(crs: LegacyGeoJSONCRS): string | null {
  if (typeof crs.properties?.name === 'string') {
    return crs.properties.name;
  }

  if (typeof crs.name === 'string') {
    return crs.name;
  }

  return null;
}

/** Parses GeoArrow extension metadata, returning an empty object for absent or invalid metadata. */
function parseExtensionMetadata(metadata: string | undefined): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  try {
    const parsedMetadata = JSON.parse(metadata);
    return parsedMetadata && typeof parsedMetadata === 'object' && !Array.isArray(parsedMetadata)
      ? parsedMetadata
      : {};
  } catch {
    return {};
  }
}

/** Clones a JSON-compatible object so schema metadata callers cannot mutate shared constants. */
function cloneJSON(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

/** Returns unique property field names in encounter order. */
function getFieldNames(propertyRows: Record<string, unknown>[]): string[] {
  const fieldNames = new Set<string>();
  for (const propertyRow of propertyRows) {
    for (const fieldName of Object.keys(propertyRow)) {
      fieldNames.add(fieldName);
    }
  }
  return [...fieldNames];
}

/** Throws when a feature property would overwrite the configured geometry column. */
function assertNoGeometryPropertyCollision(
  properties: Record<string, unknown>,
  geometryColumnName: string
): void {
  if (Object.prototype.hasOwnProperty.call(properties, geometryColumnName)) {
    throw new Error(
      `GeoArrow conversion: GeoJSON property "${geometryColumnName}" conflicts with the geometry column name`
    );
  }
}
