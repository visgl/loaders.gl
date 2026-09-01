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
  GeoArrowEncodingPreference,
  GeoJSONTable,
  Schema
} from '@loaders.gl/schema';
import type {PROJJSONCRS} from '@math.gl/crs';
import * as arrow from 'apache-arrow';
import {ArrowTableBuilder, convertSchemaToArrow} from '@loaders.gl/schema-utils';
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
import {GeoArrowBuilder, type GeoArrowBuilderEncoding} from '../geoarrow/geoarrow-builder';

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
} satisfies PROJJSONCRS;

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
} satisfies PROJJSONCRS;

/** Supported GeoArrow encodings for GeoJSON feature conversion. */
export type GeoJSONToGeoArrowEncoding = 'wkb' | 'wkt';

export type {GeoArrowEncodingPreference} from '@loaders.gl/schema';

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
  /** Preferred GeoArrow output encoding. Exact targets remain converter-only. */
  encodingPreference?: GeoArrowEncodingPreference;
  /** Loader-facing GeoArrow output preferences. */
  geoarrow?: {
    encodingPreference?: GeoArrowEncodingPreference;
  };
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
  const preference = resolveGeoArrowEncodingPreference(options);
  if (preference === 'geoarrow.geometry' || preference === 'optimized') {
    return convertFeaturesToNativeGeoArrowTable(features, options, preference);
  }
  const rows = makeGeoArrowFeatureRows(features, options);
  const schema = makeGeoArrowFeatureSchema(features, options);
  const arrowTableBuilder = new ArrowTableBuilder(schema);

  for (const row of rows) {
    arrowTableBuilder.addObjectRow(row);
  }

  return arrowTableBuilder.finishTable();
}

/** Converts GeoJSON features into a native or dense-union GeoArrow table. */
function convertFeaturesToNativeGeoArrowTable(
  features: Feature[],
  options: GeoJSONToGeoArrowOptions | undefined,
  preference: Exclude<GeoArrowEncodingPreference, 'geoarrow.wkb'>
): ArrowTable {
  const geometries = features.map(feature => feature.geometry || null);
  const dimension = getFeatureDimension(geometries);
  const encoding =
    preference === 'geoarrow.geometry' ? preference : selectOptimizedEncoding(geometries);
  const geometryVector =
    encoding === 'geoarrow.geometry'
      ? makeGeometryUnionVector(geometries, dimension)
      : makeNativeGeometryVector(geometries, encoding, dimension);
  const geometryColumnName = options?.geometryColumnName || DEFAULT_GEOMETRY_COLUMN_NAME;
  const propertyRows = features.map(feature => {
    const properties = normalizeProperties(feature.properties);
    assertNoGeometryPropertyCollision(properties, geometryColumnName);
    return properties;
  });
  const propertySchema = getPropertySchema(propertyRows);
  const schema = convertSchemaToArrow(propertySchema);
  const geometryField = new arrow.Field(
    geometryColumnName,
    geometryVector.type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      [
        'ARROW:extension:metadata',
        JSON.stringify({
          encoding,
          geometry_types: inferGeoParquetGeometryTypes(geometries)
        })
      ]
    ])
  );
  const nextFields = [...schema.fields, geometryField];
  const nextMetadata = new Map(schema.metadata || []);
  nextMetadata.set(
    'geo',
    JSON.stringify({
      version: DEFAULT_GEO_METADATA_VERSION,
      primary_column: geometryColumnName,
      columns: {
        [geometryColumnName]: {
          encoding,
          geometry_types: inferGeoParquetGeometryTypes(geometries)
        }
      }
    })
  );
  const nextSchema = new arrow.Schema(nextFields, nextMetadata);
  const propertyTableBuilder = new ArrowTableBuilder(propertySchema);
  for (const row of propertyRows) {
    propertyTableBuilder.addObjectRow(row);
  }
  const propertyTable = propertyTableBuilder.finishTable().data;
  const propertyBatch = propertyTable.batches[0];
  const children = nextFields.map((field, fieldIndex) =>
    fieldIndex < schema.fields.length
      ? propertyBatch?.getChildAt(fieldIndex)?.data[0]
      : geometryVector.data[0]
  );
  const data = arrow.makeData({
    type: new arrow.Struct(nextFields),
    length: features.length,
    nullCount: 0,
    children
  } as any);
  return {
    shape: 'arrow-table',
    data: new arrow.Table(nextSchema, [new arrow.RecordBatch(nextSchema, data as any)])
  };
}

/** Resolves the nested loader option and the bridge's direct option alias. */
export function resolveGeoArrowEncodingPreference(
  options?: Pick<GeoJSONToGeoArrowOptions, 'encodingPreference' | 'geoarrow'>
): GeoArrowEncodingPreference | undefined {
  return options?.geoarrow?.encodingPreference ?? options?.encodingPreference;
}

type GeoArrowNativeEncoding = Exclude<GeoArrowBuilderEncoding, 'geoarrow.box'>;
type GeoArrowBuilderDimension = 'xy' | 'xyz' | 'xym' | 'xyzm';
type GeoArrowGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/** Selects the smallest native encoding that can represent all feature geometries. */
function selectOptimizedEncoding(
  geometries: (Geometry | null)[]
): GeoArrowNativeEncoding | 'geoarrow.geometry' {
  const geometryKinds = new Set(
    geometries.filter(Boolean).map(geometry => (geometry as Geometry).type)
  );
  if (geometryKinds.size === 0 || geometryKinds.has('GeometryCollection')) {
    return 'geoarrow.geometry';
  }
  if (geometryKinds.size === 1) {
    return getNativeEncoding([...geometryKinds][0] as GeoArrowGeometryKind);
  }
  if (geometryKinds.size === 2) {
    if (geometryKinds.has('Point') && geometryKinds.has('MultiPoint')) {
      return 'geoarrow.multipoint';
    }
    if (geometryKinds.has('LineString') && geometryKinds.has('MultiLineString')) {
      return 'geoarrow.multilinestring';
    }
    if (geometryKinds.has('Polygon') && geometryKinds.has('MultiPolygon')) {
      return 'geoarrow.multipolygon';
    }
  }
  return 'geoarrow.geometry';
}

/** Returns the maximum coordinate dimensionality present in a feature collection. */
function getFeatureDimension(geometries: (Geometry | null)[]): GeoArrowBuilderDimension {
  let coordinateSize = 2;
  for (const geometry of geometries) {
    coordinateSize = Math.max(coordinateSize, getGeometryCoordinateSize(geometry));
  }
  return coordinateSize >= 4 ? 'xyzm' : coordinateSize === 3 ? 'xyz' : 'xy';
}

/** Finds the dimensionality of the first coordinate tuple in a geometry. */
function getGeometryCoordinateSize(geometry: Geometry | null): number {
  if (!geometry) return 2;
  if (geometry.type === 'GeometryCollection') {
    return Math.max(2, ...geometry.geometries.map(getGeometryCoordinateSize));
  }
  let value: unknown = geometry.coordinates;
  while (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
    value = value[0];
  }
  return Array.isArray(value) && value.every(item => typeof item === 'number') ? value.length : 2;
}

/** Builds one concrete native GeoArrow vector from GeoJSON geometries. */
function makeNativeGeometryVector(
  geometries: (Geometry | null)[],
  encoding: GeoArrowNativeEncoding,
  dimension: GeoArrowBuilderDimension
): arrow.Vector {
  const writers = geometries.map(geometry =>
    geometry ? builder => writeGeometryToBuilder(builder, geometry, encoding) : null
  );
  const geometryArray = GeoArrowBuilder.buildGeometryArray(writers, {encoding, dimension});
  return arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
}

/** Builds a dense union vector with native child vectors and stable type identifiers. */
function makeGeometryUnionVector(
  geometries: (Geometry | null)[],
  dimension: GeoArrowBuilderDimension
): arrow.Vector {
  const childRows = new Map<GeoArrowGeometryKind, (Geometry | null)[]>();
  const typeIds: number[] = [];
  const valueOffsets: number[] = [];
  const nullCarrierKind: GeoArrowGeometryKind = 'Point';
  childRows.set(nullCarrierKind, []);

  for (const geometry of geometries) {
    const kind = geometry?.type || nullCarrierKind;
    const rows = childRows.get(kind) || [];
    valueOffsets.push(rows.length);
    typeIds.push(getUnionTypeId(kind, dimension));
    rows.push(geometry);
    childRows.set(kind, rows);
  }

  const orderedKinds = [...childRows.keys()].sort(
    (left, right) => getUnionTypeId(left, dimension) - getUnionTypeId(right, dimension)
  );
  const fields = orderedKinds.map(
    kind =>
      new arrow.Field(
        getUnionFieldName(kind, dimension),
        kind === 'GeometryCollection'
          ? makeGeometryCollectionVector(childRows.get(kind)!, dimension).type
          : makeNativeGeometryVector(childRows.get(kind)!, getNativeEncoding(kind), dimension).type,
        true
      )
  );
  const children = orderedKinds.map(kind => {
    if (kind === 'GeometryCollection') {
      return makeGeometryCollectionVector(childRows.get(kind)!, dimension).data[0];
    }
    return makeNativeGeometryVector(childRows.get(kind)!, getNativeEncoding(kind), dimension)
      .data[0];
  });
  const unionType = new arrow.DenseUnion(
    orderedKinds.map(kind => getUnionTypeId(kind, dimension)),
    fields
  );
  return arrow.makeVector(
    arrow.makeData({
      type: unionType,
      length: geometries.length,
      nullCount: 0,
      typeIds: Int8Array.from(typeIds),
      valueOffsets: Int32Array.from(valueOffsets),
      children
    } as any)
  );
}

/** Builds the list-of-union child used by GeometryCollection union members. */
function makeGeometryCollectionVector(
  geometries: (Geometry | null)[],
  dimension: GeoArrowBuilderDimension
): arrow.Vector {
  const flattenedGeometries: (Geometry | null)[] = [];
  const offsets = [0];
  for (const geometry of geometries) {
    if (geometry?.type === 'GeometryCollection') {
      flattenedGeometries.push(...geometry.geometries);
    }
    offsets.push(flattenedGeometries.length);
  }
  const memberUnion = makeGeometryUnionVector(flattenedGeometries, dimension);
  const listType = new arrow.List(new arrow.Field('geometries', memberUnion.type, true));
  return arrow.makeVector(
    arrow.makeData({
      type: listType,
      length: geometries.length,
      nullCount: 0,
      valueOffsets: Int32Array.from(offsets),
      child: memberUnion.data[0]
    } as any)
  );
}

/** Writes one GeoJSON geometry, promoting single geometries into multi-encodings as needed. */
function writeGeometryToBuilder(
  builder: InstanceType<typeof GeoArrowBuilder>,
  geometry: Geometry,
  encoding: GeoArrowNativeEncoding
): void {
  switch (geometry.type) {
    case 'Point':
      if (encoding === 'geoarrow.multipoint') builder.beginMultiPoint(1);
      builder.beginPoint();
      writeCoordinateToBuilder(builder, geometry.coordinates);
      return;
    case 'MultiPoint':
      builder.beginMultiPoint(geometry.coordinates.length);
      for (const coordinate of geometry.coordinates) {
        builder.beginPoint();
        writeCoordinateToBuilder(builder, coordinate);
      }
      return;
    case 'LineString':
      if (encoding === 'geoarrow.multilinestring') builder.beginMultiLineString(1);
      writeLineStringToBuilder(builder, geometry.coordinates);
      return;
    case 'MultiLineString':
      builder.beginMultiLineString(geometry.coordinates.length);
      for (const line of geometry.coordinates) writeLineStringToBuilder(builder, line);
      return;
    case 'Polygon':
      if (encoding === 'geoarrow.multipolygon') builder.beginMultiPolygon(1);
      writePolygonToBuilder(builder, geometry.coordinates);
      return;
    case 'MultiPolygon':
      builder.beginMultiPolygon(geometry.coordinates.length);
      for (const polygon of geometry.coordinates) writePolygonToBuilder(builder, polygon);
      return;
    case 'GeometryCollection':
      throw new Error('GeometryCollection must be written through the dense union builder.');
  }
}

function writeLineStringToBuilder(
  builder: InstanceType<typeof GeoArrowBuilder>,
  coordinates: number[][]
): void {
  builder.beginLineString(coordinates.length);
  for (const coordinate of coordinates) writeCoordinateToBuilder(builder, coordinate);
}

function writePolygonToBuilder(
  builder: InstanceType<typeof GeoArrowBuilder>,
  coordinates: number[][][]
): void {
  builder.beginPolygon(coordinates.length);
  for (const ring of coordinates) {
    builder.beginLinearRing(ring.length);
    for (const coordinate of ring) writeCoordinateToBuilder(builder, coordinate);
  }
}

function writeCoordinateToBuilder(
  builder: InstanceType<typeof GeoArrowBuilder>,
  coordinate: number[]
): void {
  builder.writeCoordinate(
    coordinate[0] ?? Number.NaN,
    coordinate[1] ?? Number.NaN,
    coordinate[2],
    coordinate[3]
  );
}

function getNativeEncoding(kind: GeoArrowGeometryKind): GeoArrowNativeEncoding {
  switch (kind) {
    case 'Point':
      return 'geoarrow.point';
    case 'LineString':
      return 'geoarrow.linestring';
    case 'Polygon':
      return 'geoarrow.polygon';
    case 'MultiPoint':
      return 'geoarrow.multipoint';
    case 'MultiLineString':
      return 'geoarrow.multilinestring';
    case 'MultiPolygon':
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`No native GeoArrow encoding exists for ${kind}.`);
  }
}

function getUnionTypeId(kind: GeoArrowGeometryKind, dimension: GeoArrowBuilderDimension): number {
  const baseTypeId: Record<GeoArrowGeometryKind, number> = {
    Point: 1,
    LineString: 2,
    Polygon: 3,
    MultiPoint: 4,
    MultiLineString: 5,
    MultiPolygon: 6,
    GeometryCollection: 7
  };
  const dimensionOffset =
    dimension === 'xyz' ? 10 : dimension === 'xym' ? 20 : dimension === 'xyzm' ? 30 : 0;
  return baseTypeId[kind] + dimensionOffset;
}

function getUnionFieldName(
  kind: GeoArrowGeometryKind,
  dimension: GeoArrowBuilderDimension
): string {
  return dimension === 'xy' ? kind : `${kind} ${dimension.slice(1).toUpperCase()}`;
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
): {name: string; projjson: PROJJSONCRS} | null {
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
function cloneJSON<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
