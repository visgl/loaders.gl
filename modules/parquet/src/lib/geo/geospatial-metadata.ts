// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import type {Field, Schema} from '@loaders.gl/schema';
import {
  getGeoMetadata,
  getMetadataValue,
  setGeoMetadata,
  setMetadataValue,
  type GeoColumnMetadata,
  type GeoMetadata,
  type GeoParquetGeometryType
} from '@loaders.gl/gis';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';

const GEOARROW_EXTENSION_NAME_KEY = 'ARROW:extension:name';
const GEOARROW_EXTENSION_METADATA_KEY = 'ARROW:extension:metadata';
const GEOPARQUET_VERSION = '1.1.0';

type GeoArrowEncoding =
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.multipolygon'
  | 'geoarrow.polygon'
  | 'geoarrow.multilinestring'
  | 'geoarrow.linestring'
  | 'geoarrow.multipoint'
  | 'geoarrow.point'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt';

type GeoArrowMetadata = {
  encoding?: GeoArrowEncoding;
  crs?: Record<string, unknown>;
  edges?: 'spherical';
  [key: string]: unknown;
};

const GEOARROW_ENCODINGS = [
  'geoarrow.geometry',
  'geoarrow.geometrycollection',
  'geoarrow.multipolygon',
  'geoarrow.polygon',
  'geoarrow.multilinestring',
  'geoarrow.linestring',
  'geoarrow.multipoint',
  'geoarrow.point',
  'geoarrow.wkb',
  'geoarrow.wkt'
] as const satisfies GeoArrowEncoding[];

const GEOPARQUET_TO_GEOARROW_ENCODINGS = {
  wkb: 'geoarrow.wkb',
  point: 'geoarrow.point',
  linestring: 'geoarrow.linestring',
  polygon: 'geoarrow.polygon',
  multipoint: 'geoarrow.multipoint',
  multilinestring: 'geoarrow.multilinestring',
  multipolygon: 'geoarrow.multipolygon'
} as const satisfies Record<string, GeoArrowEncoding>;

const GEOARROW_TO_GEOPARQUET_ENCODINGS = {
  'geoarrow.wkb': 'wkb',
  'geoarrow.point': 'point',
  'geoarrow.linestring': 'linestring',
  'geoarrow.polygon': 'polygon',
  'geoarrow.multipoint': 'multipoint',
  'geoarrow.multilinestring': 'multilinestring',
  'geoarrow.multipolygon': 'multipolygon'
} as const;

const GEOARROW_TO_GEOMETRY_TYPE = {
  'geoarrow.point': 'Point',
  'geoarrow.linestring': 'LineString',
  'geoarrow.polygon': 'Polygon',
  'geoarrow.multipoint': 'MultiPoint',
  'geoarrow.multilinestring': 'MultiLineString',
  'geoarrow.multipolygon': 'MultiPolygon'
} as const satisfies Record<string, GeoParquetGeometryType>;

/** Returns GeoArrow geometry field metadata keyed by column name. */
function getGeometryColumnsFromSchema(schema: Schema): Record<string, GeoArrowMetadata> {
  const geometryColumns: Record<string, GeoArrowMetadata> = {};
  for (const field of schema.fields || []) {
    const metadata = getGeometryMetadataForField(field.metadata || {});
    if (metadata) {
      geometryColumns[field.name] = metadata;
    }
  }
  return geometryColumns;
}

/** Extracts GeoArrow metadata from one schema field metadata object. */
function getGeometryMetadataForField(
  fieldMetadata: Record<string, string>
): GeoArrowMetadata | null {
  let metadata: GeoArrowMetadata | null = null;
  let geoEncoding = getMetadataValue(fieldMetadata, GEOARROW_EXTENSION_NAME_KEY);
  if (geoEncoding) {
    geoEncoding = geoEncoding.toLowerCase();
    if (geoEncoding === 'wkb') {
      geoEncoding = 'geoarrow.wkb';
    }
    if (geoEncoding === 'wkt') {
      geoEncoding = 'geoarrow.wkt';
    }
    if (GEOARROW_ENCODINGS.includes(geoEncoding as GeoArrowEncoding)) {
      metadata ||= {};
      metadata.encoding = geoEncoding as GeoArrowEncoding;
    }
  }

  const columnMetadata = getMetadataValue(fieldMetadata, GEOARROW_EXTENSION_METADATA_KEY);
  if (columnMetadata) {
    try {
      metadata = {
        ...(metadata || {}),
        ...(JSON.parse(columnMetadata) as GeoArrowMetadata)
      };
    } catch {
      return metadata;
    }
  }

  return metadata;
}

/**
 * Applies GeoParquet schema metadata to matching geometry fields as GeoArrow field metadata.
 *
 * @param schema - Schema to annotate.
 * @returns The same schema reference.
 */
export function applyGeoParquetToFieldMetadata(schema: Schema): Schema {
  const geoMetadata = getGeoMetadata(schema.metadata);
  if (!geoMetadata) {
    return schema;
  }

  for (const field of schema.fields) {
    const columnMetadata = geoMetadata.columns?.[field.name];
    if (!columnMetadata) {
      continue;
    }

    const fieldMetadata = getGeoArrowMetadataFromGeoParquetField(field, columnMetadata);
    if (!fieldMetadata) {
      continue;
    }

    field.metadata ||= {};
    setMetadataValue(field.metadata, GEOARROW_EXTENSION_NAME_KEY, fieldMetadata.extensionName);

    if (fieldMetadata.extensionMetadata) {
      setMetadataValue(
        field.metadata,
        GEOARROW_EXTENSION_METADATA_KEY,
        JSON.stringify(fieldMetadata.extensionMetadata)
      );
    }
  }

  return schema;
}

/**
 * Creates an Arrow JS table whose schema metadata matches a loaders.gl schema.
 *
 * @param table - Arrow JS table to rewrap.
 * @param schema - loaders.gl schema containing desired field/schema metadata.
 * @returns Table using the updated Arrow JS schema.
 */
export function applyLoadersSchemaToArrowTable(table: arrow.Table, schema: Schema): arrow.Table {
  const arrowSchema = createArrowJsSchema(table.schema, schema);
  return new arrow.Table(arrowSchema, table.batches);
}

/**
 * Normalizes an Arrow wrapper so GeoParquet metadata is preserved and GeoArrow field metadata is attached.
 *
 * @param arrowTable - loaders.gl Arrow table wrapper.
 * @param schemaMetadata - Optional schema metadata override from the Parquet footer.
 * @returns Arrow table wrapper with synchronized schema metadata.
 */
export function normalizeArrowTableGeoMetadata(
  arrowTable: {shape: 'arrow-table'; data: arrow.Table; schema?: Schema},
  schemaMetadata?: Map<string, string> | Record<string, string>
): {shape: 'arrow-table'; data: arrow.Table; schema: Schema} {
  const schema = convertArrowToSchema(arrowTable.data.schema);
  mergeSchemaMetadata(schema, schemaMetadata);
  applyGeoParquetToFieldMetadata(schema);

  return {
    shape: 'arrow-table',
    data: applyLoadersSchemaToArrowTable(arrowTable.data, schema),
    schema
  };
}

/**
 * Synthesizes GeoParquet schema metadata from GeoArrow field metadata when needed.
 *
 * @param schema - Schema to inspect and update.
 * @returns The same schema reference.
 */
export function ensureGeoParquetMetadata(schema: Schema): Schema {
  schema.metadata ||= {};
  const rawExistingGeoMetadata = getGeoMetadata(schema.metadata);
  if (isValidGeoParquetMetadata(rawExistingGeoMetadata)) {
    return schema;
  }
  const existingGeoMetadata: GeoMetadata | undefined = rawExistingGeoMetadata || undefined;

  const geometryColumns = getGeometryColumnsFromSchema(schema);
  const geometryColumnNames = Object.keys(geometryColumns);
  if (geometryColumnNames.length === 0) {
    return schema;
  }

  const geoMetadata: GeoMetadata = {
    version: GEOPARQUET_VERSION,
    primary_column: geometryColumnNames[0],
    columns: {}
  };

  for (const geometryColumnName of geometryColumnNames) {
    const geometryMetadata = geometryColumns[geometryColumnName];
    const synthesizedColumnMetadata = synthesizeGeoParquetColumnMetadata(geometryMetadata);
    if (!synthesizedColumnMetadata) {
      continue;
    }

    const existingColumnMetadata = existingGeoMetadata?.columns?.[geometryColumnName];
    geoMetadata.columns[geometryColumnName] = {
      ...pickValidOptionalGeoParquetColumnMetadata(existingColumnMetadata),
      ...synthesizedColumnMetadata
    };
  }

  if (Object.keys(geoMetadata.columns).length === 0) {
    return schema;
  }

  setGeoMetadata(schema.metadata, geoMetadata);
  return schema;
}

/**
 * Ensures an Arrow table wrapper carries valid GeoParquet schema metadata when GeoArrow fields are present.
 *
 * @param arrowTable - Arrow table wrapper to inspect and update.
 * @returns Updated Arrow table wrapper.
 */
export function ensureGeoParquetMetadataOnArrowTable(arrowTable: {
  shape: 'arrow-table';
  data: arrow.Table;
  schema?: Schema;
}): {shape: 'arrow-table'; data: arrow.Table; schema: Schema} {
  const schema = arrowTable.schema || convertArrowToSchema(arrowTable.data.schema);
  ensureGeoParquetMetadata(schema);

  return {
    shape: 'arrow-table',
    data: applyLoadersSchemaToArrowTable(arrowTable.data, schema),
    schema
  };
}

/**
 * Returns Parquet file key/value metadata as a plain map.
 *
 * @param parquetMetadata - parquet-wasm metadata object.
 * @returns Metadata map.
 */
export function getParquetFileMetadataMap(parquetMetadata: {
  fileMetadata(): {keyValueMetadata(): Map<string, string>};
}): Map<string, string> {
  return parquetMetadata.fileMetadata().keyValueMetadata();
}

function mergeSchemaMetadata(
  schema: Schema,
  schemaMetadata?: Map<string, string> | Record<string, string>
): void {
  if (!schemaMetadata) {
    return;
  }

  schema.metadata ||= {};
  for (const [metadataKey, metadataValue] of getMetadataEntries(schemaMetadata)) {
    setMetadataValue(schema.metadata, metadataKey, metadataValue);
  }
}

function createArrowJsSchema(baseSchema: arrow.Schema, schema: Schema): arrow.Schema {
  const fields = baseSchema.fields.map(baseField => {
    const nextField = schema.fields.find(field => field.name === baseField.name);
    if (!nextField?.metadata) {
      return baseField;
    }

    return baseField.clone({
      metadata: createMetadataMap(nextField.metadata)
    });
  });

  return new arrow.Schema(
    fields,
    createMetadataMap(schema.metadata),
    baseSchema.dictionaries,
    baseSchema.metadataVersion
  );
}

function getGeoArrowMetadataFromGeoParquetField(
  field: Field,
  columnMetadata: GeoColumnMetadata
): {extensionName: GeoArrowEncoding; extensionMetadata?: Record<string, unknown>} | null {
  const normalizedEncoding = String(columnMetadata.encoding || '').toLowerCase();
  const extensionName =
    GEOPARQUET_TO_GEOARROW_ENCODINGS[
      normalizedEncoding as keyof typeof GEOPARQUET_TO_GEOARROW_ENCODINGS
    ];

  if (!extensionName) {
    return null;
  }

  if (normalizedEncoding === 'wkb' && field.type !== 'binary') {
    return null;
  }

  if (normalizedEncoding !== 'wkb' && (field.type === 'binary' || field.type === 'utf8')) {
    return null;
  }

  const extensionMetadata: Record<string, unknown> = {};
  if (columnMetadata.crs !== undefined) {
    extensionMetadata.crs = columnMetadata.crs;
  }
  if (columnMetadata.crs_type !== undefined) {
    extensionMetadata.crs_type = columnMetadata.crs_type;
  }
  if (columnMetadata.edges === 'spherical') {
    extensionMetadata.edges = 'spherical';
  }

  return Object.keys(extensionMetadata).length > 0
    ? {extensionName, extensionMetadata}
    : {extensionName};
}

function isValidGeoParquetMetadata(geoMetadata: GeoMetadata | null): boolean {
  if (!geoMetadata || typeof geoMetadata !== 'object') {
    return false;
  }

  if (
    typeof geoMetadata.version !== 'string' ||
    typeof geoMetadata.primary_column !== 'string' ||
    !geoMetadata.columns ||
    typeof geoMetadata.columns !== 'object'
  ) {
    return false;
  }

  const primaryColumnMetadata = geoMetadata.columns[geoMetadata.primary_column];
  if (!primaryColumnMetadata) {
    return false;
  }

  return Object.values(geoMetadata.columns).every(isValidGeoParquetColumnMetadata);
}

function isValidGeoParquetColumnMetadata(columnMetadata: unknown): boolean {
  if (!columnMetadata || typeof columnMetadata !== 'object') {
    return false;
  }

  const {encoding, geometry_types} = columnMetadata as GeoColumnMetadata;
  return (
    typeof encoding === 'string' &&
    Boolean(
      GEOPARQUET_TO_GEOARROW_ENCODINGS[
        encoding.toLowerCase() as keyof typeof GEOPARQUET_TO_GEOARROW_ENCODINGS
      ]
    ) &&
    Array.isArray(geometry_types)
  );
}

function synthesizeGeoParquetColumnMetadata(geometryMetadata: {
  encoding?: GeoArrowEncoding;
  crs?: Record<string, unknown>;
  crs_type?: 'projjson' | 'wkt2:2019';
  edges?: 'spherical';
  geometry_types?: GeoParquetGeometryType[];
}): GeoColumnMetadata | null {
  const encoding = geometryMetadata.encoding
    ? GEOARROW_TO_GEOPARQUET_ENCODINGS[
        geometryMetadata.encoding as keyof typeof GEOARROW_TO_GEOPARQUET_ENCODINGS
      ]
    : null;

  if (!encoding) {
    return null;
  }

  const geometryTypes = Array.isArray(geometryMetadata.geometry_types)
    ? geometryMetadata.geometry_types
    : inferGeometryTypesFromGeoArrowEncoding(geometryMetadata.encoding);

  const columnMetadata: GeoColumnMetadata = {
    encoding,
    geometry_types: geometryTypes
  };

  if (geometryMetadata.crs !== undefined) {
    columnMetadata.crs = geometryMetadata.crs;
  }
  if (geometryMetadata.crs_type !== undefined) {
    columnMetadata.crs_type = geometryMetadata.crs_type;
  }
  if (geometryMetadata.edges === 'spherical') {
    columnMetadata.edges = 'spherical';
  }

  return columnMetadata;
}

function inferGeometryTypesFromGeoArrowEncoding(
  encoding?: GeoArrowEncoding
): GeoParquetGeometryType[] {
  const geometryType = encoding
    ? GEOARROW_TO_GEOMETRY_TYPE[encoding as keyof typeof GEOARROW_TO_GEOMETRY_TYPE]
    : null;
  return geometryType ? [geometryType] : [];
}

function pickValidOptionalGeoParquetColumnMetadata(
  columnMetadata: GeoColumnMetadata | undefined
): Partial<GeoColumnMetadata> {
  if (!columnMetadata) {
    return {};
  }

  const nextColumnMetadata: Partial<GeoColumnMetadata> = {};

  if (columnMetadata.orientation === 'counterclockwise') {
    nextColumnMetadata.orientation = columnMetadata.orientation;
  }

  if (isValidBBox(columnMetadata.bbox)) {
    nextColumnMetadata.bbox = columnMetadata.bbox;
  }

  if (typeof columnMetadata.epoch === 'number' && Number.isFinite(columnMetadata.epoch)) {
    nextColumnMetadata.epoch = columnMetadata.epoch;
  }

  if (columnMetadata.covering && typeof columnMetadata.covering === 'object') {
    nextColumnMetadata.covering = columnMetadata.covering;
  }

  return nextColumnMetadata;
}

function isValidBBox(
  bbox: GeoColumnMetadata['bbox']
): bbox is [number, number, number, number] | [number, number, number, number, number, number] {
  if (!Array.isArray(bbox) || (bbox.length !== 4 && bbox.length !== 6)) {
    return false;
  }

  return bbox.every(value => typeof value === 'number' && Number.isFinite(value));
}

function getMetadataEntries(
  metadata: Map<string, string> | Record<string, string>
): [string, string][] {
  if (metadata instanceof Map) {
    return [...metadata.entries()];
  }
  return Object.entries(metadata);
}

function createMetadataMap(
  metadata: Map<string, string> | Record<string, string> | undefined
): Map<string, string> {
  if (!metadata) {
    return new Map();
  }

  if (metadata instanceof Map) {
    return new Map(metadata);
  }

  return new Map(
    Object.entries(metadata).map(([metadataKey, metadataValue]) => [
      metadataKey,
      String(metadataValue)
    ])
  );
}
