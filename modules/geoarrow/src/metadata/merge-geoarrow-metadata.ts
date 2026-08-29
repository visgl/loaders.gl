// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  GeoArrowMetadata,
  GeoColumnMetadata,
  GeoMetadata,
  GeoParquetGeometryType,
  Metadata
} from '@loaders.gl/schema';
import {getGeoMetadata, setGeoMetadata} from '@loaders.gl/schema';
import {GEOARROW_GEOMETRY_TYPES} from '../geoarrow-conformance';
import {getGeometryMetadataForField} from './geoarrow-metadata';

/** Conflict handling policy for GeoArrow metadata evolution. */
export type GeoArrowMetadataMergeMode = 'strict' | 'permissive' | 'repair';

/** One metadata conflict found while merging geometry columns or schemas. */
export type GeoArrowMetadataConflict = {
  /** Metadata key whose values disagree. */
  key: string;
  /** Distinct values observed for the key. */
  values: unknown[];
  /** Action taken by the selected merge mode. */
  action: 'rejected' | 'preserved-first' | 'dropped';
};

/** Options controlling deterministic GeoArrow metadata merging. */
export type GeoArrowMetadataMergeOptions = {
  /** Conflict policy; strict is the default. */
  mode?: GeoArrowMetadataMergeMode;
};

/** Result of merging GeoArrow metadata while retaining actionable diagnostics. */
export type GeoArrowMetadataMergeResult = {
  /** Merged metadata, with conflicting keys omitted in strict and repair modes. */
  metadata: GeoArrowMetadata;
  /** Whether the input metadata was conflict-free under strict semantics. */
  valid: boolean;
  /** Deterministically ordered metadata conflicts. */
  conflicts: GeoArrowMetadataConflict[];
};

/** Result of merging Arrow schemas while preserving GeoArrow field and table metadata. */
export type GeoArrowSchemaMergeResult = {
  /** Merged Arrow schema, or `null` when no schemas were supplied. */
  schema: arrow.Schema | null;
  /** Whether all schema and geometry metadata merged without conflicts. */
  valid: boolean;
  /** Deterministically ordered schema, field, and GeoParquet conflicts. */
  conflicts: GeoArrowMetadataConflict[];
};

/**
 * Merges GeoArrow metadata for projection, concatenation, joins, or derived columns.
 *
 * Geometry types are set-unioned in the canonical GeoParquet order. Scalar metadata is retained
 * only when all defined values are structurally equal. Permissive mode keeps the first value for
 * conflicting keys, while repair mode drops the key so downstream consumers cannot mistake a
 * partial schema for a complete one.
 *
 * @param metadataValues Metadata values from the participating fields or tables.
 * @param options Merge policy.
 * @returns Merged metadata and deterministic conflict diagnostics.
 */
export function mergeGeoArrowMetadata(
  metadataValues: readonly (GeoArrowMetadata | null | undefined)[],
  options: GeoArrowMetadataMergeOptions = {}
): GeoArrowMetadataMergeResult {
  const mode = options.mode || 'strict';
  const definedMetadata = metadataValues.filter(
    (metadata): metadata is GeoArrowMetadata => metadata != null
  );
  const metadata: GeoArrowMetadata = {};
  const conflicts: GeoArrowMetadataConflict[] = [];
  const keys = new Set<string>();
  for (const value of definedMetadata) {
    for (const key of Object.keys(value)) keys.add(key);
  }

  for (const key of [...keys].sort()) {
    const values = definedMetadata.map(value => value[key]).filter(value => value !== undefined);
    if (values.length === 0) continue;

    if (key === 'geometry_types') {
      metadata.geometry_types = mergeGeometryTypes(values);
      continue;
    }

    const distinctValues = getDistinctValues(values);
    if (distinctValues.length === 1) {
      metadata[key] = distinctValues[0];
      continue;
    }

    const action =
      mode === 'permissive' ? 'preserved-first' : mode === 'repair' ? 'dropped' : 'rejected';
    conflicts.push({key, values: distinctValues, action});
    if (mode === 'permissive') metadata[key] = values[0];
  }

  return {metadata, valid: conflicts.length === 0, conflicts};
}

/**
 * Merges compatible Arrow schemas without silently discarding GeoArrow metadata.
 *
 * Physical fields must have the same names and Arrow representations in every input schema.
 * Field extension metadata and the schema-level `geo` object are merged independently. Geometry
 * types are unioned, while CRS, encoding, edge, version, primary-column, and unknown metadata
 * conflicts follow the selected strict, permissive, or repair policy.
 *
 * @param schemas Arrow schemas participating in concatenation, rechunking, or projection.
 * @param options Conflict policy.
 * @returns A schema suitable for the merged batches and actionable conflicts.
 */
export function mergeGeoArrowSchemas(
  schemas: readonly arrow.Schema[],
  options: GeoArrowMetadataMergeOptions = {}
): GeoArrowSchemaMergeResult {
  if (schemas.length === 0) {
    return {schema: null, valid: true, conflicts: []};
  }

  const conflicts: GeoArrowMetadataConflict[] = [];
  const firstSchema = schemas[0];
  for (const schema of schemas.slice(1)) {
    compareSchemaFields(firstSchema, schema, conflicts);
  }

  const mergedFields = firstSchema.fields.map(field => {
    const fieldMetadataValues = schemas
      .map(schema => schema.fields.find(candidate => candidate.name === field.name))
      .map(candidate =>
        candidate ? getGeometryMetadataForField(candidate.metadata || new Map()) : null
      );
    const mergedFieldMetadata = mergeGeoArrowMetadata(fieldMetadataValues, options);
    appendConflicts(conflicts, field.name, mergedFieldMetadata.conflicts);
    return mergeFieldMetadata(
      field,
      mergedFieldMetadata.metadata,
      mergedFieldMetadata.conflicts,
      options.mode
    );
  });

  const mergedSchemaMetadata = mergeSchemaMetadataValues(schemas, options, conflicts);
  const mergedSchema = new arrow.Schema(
    mergedFields,
    mergedSchemaMetadata,
    firstSchema.dictionaries,
    firstSchema.metadataVersion
  );
  return {schema: mergedSchema, valid: conflicts.length === 0, conflicts};
}

/** Compares field names and physical Arrow representations before metadata merging. */
function compareSchemaFields(
  firstSchema: arrow.Schema,
  schema: arrow.Schema,
  conflicts: GeoArrowMetadataConflict[]
): void {
  if (firstSchema.fields.length !== schema.fields.length) {
    conflicts.push({
      key: 'schema.fields',
      values: [firstSchema.fields.map(field => field.name), schema.fields.map(field => field.name)],
      action: 'rejected'
    });
  }

  for (const firstField of firstSchema.fields) {
    const field = schema.fields.find(candidate => candidate.name === firstField.name);
    if (!field) {
      conflicts.push({
        key: `field.${firstField.name}`,
        values: ['present', 'missing'],
        action: 'rejected'
      });
    } else if (field.type.toString() !== firstField.type.toString()) {
      conflicts.push({
        key: `field.${firstField.name}.type`,
        values: [firstField.type.toString(), field.type.toString()],
        action: 'rejected'
      });
    }
  }
}

/** Applies merged GeoArrow extension metadata to a cloned field. */
function mergeFieldMetadata(
  field: arrow.Field,
  metadata: GeoArrowMetadata,
  conflicts: readonly GeoArrowMetadataConflict[],
  mode: GeoArrowMetadataMergeMode | undefined
): arrow.Field {
  if (Object.keys(metadata).length === 0 && conflicts.length === 0) return field;
  const nextMetadata = new Map(field.metadata || []);
  nextMetadata.delete('ARROW:extension:name');
  nextMetadata.delete('ARROW:extension:metadata');
  const dropsEncodingConflict =
    mode !== 'permissive' && conflicts.some(conflict => conflict.key === 'encoding');
  if (metadata.encoding && !dropsEncodingConflict) {
    nextMetadata.set('ARROW:extension:name', metadata.encoding);
  }
  if (Object.keys(metadata).length > 0 && (metadata.encoding || !dropsEncodingConflict)) {
    nextMetadata.set('ARROW:extension:metadata', JSON.stringify(metadata));
  }
  return field.clone({metadata: nextMetadata});
}

/** Merges ordinary schema keys and the structured GeoParquet `geo` metadata object. */
function mergeSchemaMetadataValues(
  schemas: readonly arrow.Schema[],
  options: GeoArrowMetadataMergeOptions,
  conflicts: GeoArrowMetadataConflict[]
): Map<string, string> {
  const mergedMetadata = new Map<string, string>();
  const keys = new Set<string>();
  for (const schema of schemas) {
    for (const key of (schema.metadata || new Map()).keys()) keys.add(key);
  }

  for (const key of [...keys].sort()) {
    if (key === 'geo') continue;
    const values = schemas
      .map(schema => schema.metadata?.get(key))
      .filter((value): value is string => value !== undefined);
    const distinctValues = getDistinctValues(values);
    if (distinctValues.length === 1) {
      mergedMetadata.set(key, distinctValues[0] as string);
    } else if (distinctValues.length > 1) {
      const mergeAction = getConflictAction(options.mode);
      conflicts.push({key: `schema.${key}`, values: distinctValues, action: mergeAction});
      if (mergeAction === 'preserved-first') mergedMetadata.set(key, values[0]);
    }
  }

  const geoMetadataValues = schemas
    .map(schema => getGeoMetadata(schema.metadata as Metadata | undefined))
    .filter((value): value is GeoMetadata => value !== null);
  const mergedGeoMetadata = mergeGeoMetadata(geoMetadataValues, options, conflicts);
  if (mergedGeoMetadata) setGeoMetadata(mergedMetadata, mergedGeoMetadata);
  return mergedMetadata;
}

/** Merges file-level GeoParquet metadata and all geometry columns. */
function mergeGeoMetadata(
  values: readonly GeoMetadata[],
  options: GeoArrowMetadataMergeOptions,
  conflicts: GeoArrowMetadataConflict[]
): GeoMetadata | null {
  if (values.length === 0) return null;
  const merged: GeoMetadata = {columns: {}};
  const topLevelValues = values.map(value => {
    const {columns: _columns, ...topLevel} = value;
    return topLevel;
  });
  const topLevelResult = mergeGeoArrowMetadata(topLevelValues, options);
  appendConflicts(conflicts, 'geo', topLevelResult.conflicts);
  Object.assign(merged, topLevelResult.metadata);

  const columnNames = new Set<string>();
  for (const value of values) {
    for (const columnName of Object.keys(value.columns || {})) columnNames.add(columnName);
  }
  for (const columnName of [...columnNames].sort()) {
    const columnValues = values
      .map(value => value.columns?.[columnName])
      .filter((value): value is GeoColumnMetadata => value !== undefined);
    const columnResult = mergeGeoArrowMetadata(
      columnValues as unknown as readonly (GeoArrowMetadata | null | undefined)[],
      options
    );
    appendConflicts(conflicts, `geo.columns.${columnName}`, columnResult.conflicts);
    if (
      typeof columnResult.metadata.encoding === 'string' &&
      Array.isArray(columnResult.metadata.geometry_types)
    ) {
      merged.columns[columnName] = columnResult.metadata as GeoColumnMetadata;
    }
  }
  return Object.keys(merged.columns).length > 0 ? merged : null;
}

/** Adds a path prefix to conflicts from nested field or GeoParquet metadata. */
function appendConflicts(
  conflicts: GeoArrowMetadataConflict[],
  prefix: string,
  nestedConflicts: readonly GeoArrowMetadataConflict[]
): void {
  for (const conflict of nestedConflicts) {
    conflicts.push({...conflict, key: `${prefix}.${conflict.key}`});
  }
}

/** Returns the selected action for a metadata conflict. */
function getConflictAction(
  mode: GeoArrowMetadataMergeMode | undefined
): GeoArrowMetadataConflict['action'] {
  return mode === 'permissive' ? 'preserved-first' : mode === 'repair' ? 'dropped' : 'rejected';
}

/** Returns geometry types as a canonical, duplicate-free union. */
function mergeGeometryTypes(values: unknown[]): GeoParquetGeometryType[] {
  const geometryTypes = new Set<GeoParquetGeometryType>();
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    for (const geometryType of value) {
      if (typeof geometryType === 'string')
        geometryTypes.add(geometryType as GeoParquetGeometryType);
    }
  }
  return [...geometryTypes].sort(
    (left, right) =>
      getGeometryTypeOrder(left) - getGeometryTypeOrder(right) || left.localeCompare(right)
  );
}

/** Returns distinct values using canonical structural comparison. */
function getDistinctValues(values: unknown[]): unknown[] {
  const distinctValues: unknown[] = [];
  const serializedValues = new Set<string>();
  for (const value of values) {
    const serializedValue = serializeMetadataValue(value);
    if (!serializedValues.has(serializedValue)) {
      serializedValues.add(serializedValue);
      distinctValues.push(value);
    }
  }
  return distinctValues;
}

/** Serializes metadata values with sorted object keys for order-independent comparison. */
function serializeMetadataValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(serializeMetadataValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        key =>
          `${JSON.stringify(key)}:${serializeMetadataValue((value as Record<string, unknown>)[key])}`
      )
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Returns the canonical order of a geometry type, placing unknown values last. */
function getGeometryTypeOrder(geometryType: GeoParquetGeometryType): number {
  const geometryTypeName = geometryType.replace(/ [ZM]+$/, '');
  const order = GEOARROW_GEOMETRY_TYPES.indexOf(
    geometryTypeName as (typeof GEOARROW_GEOMETRY_TYPES)[number]
  );
  return order < 0 ? GEOARROW_GEOMETRY_TYPES.length : order;
}
