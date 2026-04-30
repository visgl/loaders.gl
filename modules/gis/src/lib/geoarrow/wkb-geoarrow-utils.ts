// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Field, Geometry, Schema} from '@loaders.gl/schema';
import type {GeoArrowBuilderEncoding} from './geoarrow-builder';
import {convertGeometryToWKB} from '../geometry-converters/wkb/convert-geometry-to-wkb';
import {
  getGeoMetadata,
  setGeoMetadata,
  type GeoColumnMetadata,
  type GeoMetadata,
  type GeoParquetGeometryType
} from './geoparquet-metadata';
import type {Metadata} from './metadata-utils';

const DEFAULT_GEO_METADATA_VERSION = '1.1.0';

/**
 * Options for creating or updating one WKB geometry column definition.
 */
export type WKBGeometryColumnOptions = {
  /** Geometry column name. */
  geometryColumnName?: string;
  /** Primary geometry column name. Defaults to `geometryColumnName`. */
  primaryColumnName?: string;
  /** Known geometry type strings for metadata. */
  geometryTypes?: GeoParquetGeometryType[];
  /** Whether the Arrow field is nullable. */
  nullable?: boolean;
  /** GeoParquet metadata version. */
  version?: string;
  /** Additional column metadata fields to preserve. */
  columnMetadata?: Omit<GeoColumnMetadata, 'encoding' | 'geometry_types'>;
};

/** Options for creating or updating one typed GeoArrow geometry column definition. */
export type GeoArrowGeometryColumnOptions = {
  /** Geometry column name. */
  geometryColumnName?: string;
  /** Primary geometry column name. Defaults to `geometryColumnName`. */
  primaryColumnName?: string;
  /** GeoArrow geometry encoding. */
  encoding: GeoArrowBuilderEncoding;
  /** Coordinate tuple size. */
  coordinateSize?: 2 | 3;
  /** Known geometry type strings for metadata. */
  geometryTypes?: GeoParquetGeometryType[];
  /** Whether the Arrow field is nullable. */
  nullable?: boolean;
  /** GeoParquet metadata version. */
  version?: string;
  /** Additional column metadata fields to preserve. */
  columnMetadata?: Omit<GeoColumnMetadata, 'encoding' | 'geometry_types'>;
};

/**
 * Creates a nullable binary Arrow field for a WKB geometry column.
 *
 * @param geometryColumnName - Geometry column name.
 * @param nullable - Whether the field is nullable.
 * @returns Arrow field definition.
 */
export function makeWKBGeometryField(geometryColumnName = 'geometry', nullable = true): Field {
  return {
    name: geometryColumnName,
    type: 'binary',
    nullable,
    metadata: {
      'ARROW:extension:name': 'geoarrow.wkb'
    }
  };
}

/**
 * Creates a nullable nested Arrow field for a typed GeoArrow geometry column.
 *
 * @param options - GeoArrow geometry field options.
 * @returns Arrow field definition.
 */
export function makeGeoArrowGeometryField(options: GeoArrowGeometryColumnOptions): Field {
  const coordinateSize = options.coordinateSize || 2;
  const coordinateField: Field = {
    name: 'xy',
    type: {
      type: 'fixed-size-list',
      listSize: coordinateSize,
      children: [{name: 'value', type: 'float64', nullable: false}]
    },
    nullable: false
  };
  return {
    name: options.geometryColumnName || 'geometry',
    type: getGeoArrowGeometryFieldType(options.encoding, coordinateField),
    nullable: options.nullable ?? true,
    metadata: {
      'ARROW:extension:name': options.encoding
    }
  };
}

/**
 * Updates schema-level GeoParquet metadata for one WKB geometry column.
 *
 * @param metadata - Schema metadata container.
 * @param options - WKB geometry column options.
 */
export function setWKBGeometryColumnMetadata(
  metadata: Metadata,
  options: WKBGeometryColumnOptions = {}
): void {
  const geometryColumnName = options.geometryColumnName || 'geometry';
  const primaryColumnName = options.primaryColumnName || geometryColumnName;
  const geometryTypes = options.geometryTypes || [];
  const nextGeoMetadata: GeoMetadata = getGeoMetadata(metadata) || {columns: {}};

  nextGeoMetadata.version =
    options.version || nextGeoMetadata.version || DEFAULT_GEO_METADATA_VERSION;
  nextGeoMetadata.primary_column = primaryColumnName;
  nextGeoMetadata.columns ||= {};
  nextGeoMetadata.columns[geometryColumnName] = {
    ...nextGeoMetadata.columns[geometryColumnName],
    ...options.columnMetadata,
    encoding: 'wkb',
    geometry_types: geometryTypes
  };

  setGeoMetadata(metadata, nextGeoMetadata);
}

/**
 * Updates schema-level GeoParquet metadata for one typed GeoArrow geometry column.
 *
 * @param metadata - Schema metadata container.
 * @param options - GeoArrow geometry column options.
 */
export function setGeoArrowGeometryColumnMetadata(
  metadata: Metadata,
  options: GeoArrowGeometryColumnOptions
): void {
  const geometryColumnName = options.geometryColumnName || 'geometry';
  const primaryColumnName = options.primaryColumnName || geometryColumnName;
  const geometryTypes = options.geometryTypes || [];
  const nextGeoMetadata: GeoMetadata = getGeoMetadata(metadata) || {columns: {}};

  nextGeoMetadata.version =
    options.version || nextGeoMetadata.version || DEFAULT_GEO_METADATA_VERSION;
  nextGeoMetadata.primary_column = primaryColumnName;
  nextGeoMetadata.columns ||= {};
  nextGeoMetadata.columns[geometryColumnName] = {
    ...nextGeoMetadata.columns[geometryColumnName],
    ...options.columnMetadata,
    encoding: options.encoding.replace('geoarrow.', '') as GeoColumnMetadata['encoding'],
    geometry_types: geometryTypes
  };

  setGeoMetadata(metadata, nextGeoMetadata);
}

/**
 * Updates one schema with WKB geometry column metadata.
 *
 * @param schema - Schema to update.
 * @param options - WKB geometry column options.
 * @returns The same schema reference for chaining.
 */
export function setWKBGeometrySchemaMetadata(
  schema: Schema,
  options: WKBGeometryColumnOptions = {}
): Schema {
  schema.metadata ||= {};
  setWKBGeometryColumnMetadata(schema.metadata, options);
  return schema;
}

/**
 * Encodes one geometry value as WKB bytes or passes through existing WKB bytes.
 *
 * @param value - Geometry or WKB byte value.
 * @returns WKB bytes or `null`.
 */
export function encodeWKBGeometryValue(
  value: Geometry | ArrayBuffer | ArrayBufferView | null | undefined
): Uint8Array | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (isGeometry(value)) {
    return new Uint8Array(convertGeometryToWKB(value, getGeometryWKBOptions(value)));
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value.slice(0));
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
    );
  }

  throw new Error('Expected a Geometry, ArrayBuffer, ArrayBufferView, or null for WKB encoding.');
}

/**
 * Infers WKB serialization flags from geometry dimensionality.
 *
 * @param geometry - Geometry to inspect.
 * @returns WKB dimensional flags.
 */
export function getGeometryWKBOptions(geometry: Geometry): {hasZ?: boolean; hasM?: boolean} {
  const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
  return {
    hasZ: dimensions > 2,
    hasM: dimensions > 3
  };
}

/**
 * Infers GeoParquet geometry type strings from a sequence of geometries.
 *
 * @param geometries - Geometries to inspect.
 * @returns Unique geometry type strings in encounter order.
 */
export function inferGeoParquetGeometryTypes(
  geometries: Iterable<Geometry | null | undefined>
): GeoParquetGeometryType[] {
  const geometryTypes = new Set<GeoParquetGeometryType>();

  for (const geometry of geometries) {
    if (!geometry) {
      continue;
    }

    const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
    geometryTypes.add(
      (dimensions > 2 ? `${geometry.type} Z` : geometry.type) as GeoParquetGeometryType
    );
  }

  return [...geometryTypes];
}

/**
 * Returns the coordinate dimensionality of one representative coordinate tuple.
 *
 * @param coordinates - Nested coordinate payload.
 * @returns Coordinate tuple length, defaulting to `2`.
 */
export function getCoordinateDimensions(coordinates: unknown): number {
  if (!Array.isArray(coordinates)) {
    return 2;
  }

  if (typeof coordinates[0] === 'number') {
    return coordinates.length;
  }

  if (coordinates.length === 0) {
    return 2;
  }

  return getCoordinateDimensions(coordinates[0]);
}

/**
 * Extracts one representative coordinate payload from a geometry.
 *
 * @param geometry - Geometry to inspect.
 * @returns Representative coordinate payload or `undefined`.
 */
export function getGeometrySampleCoordinates(geometry: Geometry): unknown {
  if ('coordinates' in geometry) {
    return geometry.coordinates;
  }

  if ('geometries' in geometry && geometry.geometries.length > 0) {
    return getGeometrySampleCoordinates(geometry.geometries[0]);
  }

  return undefined;
}

function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'type' in value && ('coordinates' in value || 'geometries' in value);
}

function getGeoArrowGeometryFieldType(
  encoding: GeoArrowBuilderEncoding,
  coordinateField: Field
): Field['type'] {
  switch (encoding) {
    case 'geoarrow.point':
      return coordinateField.type;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      return {type: 'list', children: [coordinateField]};
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring':
      return {
        type: 'list',
        children: [{name: 'rings', type: {type: 'list', children: [coordinateField]}}]
      };
    case 'geoarrow.multipolygon':
      return {
        type: 'list',
        children: [
          {
            name: 'polygons',
            type: {
              type: 'list',
              children: [{name: 'rings', type: {type: 'list', children: [coordinateField]}}]
            }
          }
        ]
      };
    default:
      throw new Error(`Unsupported GeoArrow encoding ${encoding}`);
  }
}
