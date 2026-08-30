// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  ArrowTableBatch,
  GeoArrowDimension,
  GeoArrowMetadata,
  GeoMetadata,
  GeoParquetGeometryType
} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {
  type GeoArrowGeometryConvertOptions,
  type GeoArrowGeometryTarget,
  convertGeoArrowGeometry
} from './geoarrow-converter/convert-geoarrow-geometry';
import {GEOARROW_GEOMETRY_TYPES} from './geoarrow-conformance';
import {getGeometryColumnsFromSchema} from './metadata/geoarrow-metadata';
import {getGeoMetadata} from './metadata/geoparquet-metadata';
import {type GeoArrowUnionGeometryKind} from './lib/kernels/geoarrow-union';

/** Options for converting Arrow table batches without renegotiating stream schemas. */
export type GeoArrowStreamConvertOptions = GeoArrowGeometryConvertOptions & {
  /** Abort signal checked between batches. */
  signal?: AbortSignal;
};

/**
 * Converts Arrow table batches to GeoArrow while preserving one schema across the stream.
 *
 * When a WKB or WKT geometry column lacks trusted `geometry_types` metadata, `native` and
 * `geoarrow.geometry` targets use a canonical dense union seeded with every geometry family and
 * dimension. This makes a batch containing only points compatible with a later batch containing
 * polygons without buffering the stream or renegotiating its Arrow type.
 *
 * @param batches Input Arrow table batches.
 * @param targetEncoding Requested GeoArrow target.
 * @param options Conversion and cancellation options.
 * @returns Async iterator of converted Arrow table batches.
 */
export async function* convertGeoArrowBatches(
  batches: Iterable<ArrowTableBatch> | AsyncIterable<ArrowTableBatch>,
  targetEncoding: GeoArrowGeometryTarget,
  options: GeoArrowStreamConvertOptions = {}
): AsyncIterableIterator<ArrowTableBatch> {
  let stableGeometryTypes: readonly GeoParquetGeometryType[] | undefined;
  let firstBatch = true;

  for await (const batch of batches) {
    if (options.signal?.aborted) {
      throw createAbortError();
    }
    if (!batch || batch.shape !== 'arrow-table') {
      throw new Error('convertGeoArrowBatches requires ArrowTableBatch inputs.');
    }

    if (firstBatch) {
      stableGeometryTypes = getStableGeometryTypes(batch.data, targetEncoding, options);
      firstBatch = false;
    }

    const conversionOptions = stableGeometryTypes
      ? {...options, geometryTypes: stableGeometryTypes}
      : options;
    const convertedTable = convertGeoArrowGeometry(batch.data, targetEncoding, conversionOptions);
    const stableTable = stableGeometryTypes
      ? stabilizeGeometryUnionTable(convertedTable, stableGeometryTypes)
      : convertedTable;
    yield {
      ...batch,
      data: stableTable,
      schema: convertArrowToSchema(stableTable.schema),
      length: stableTable.numRows
    };
  }
}

/** Rebuilds each batch against the same dense-union child schema without buffering later batches. */
function stabilizeGeometryUnionTable(
  table: arrow.Table,
  geometryTypes: readonly GeoParquetGeometryType[]
): arrow.Table {
  const stableColumns = new Map<string, arrow.Vector>();
  const geometryColumns = getGeometryColumnsFromSchema(table.schema);
  for (const field of table.schema.fields) {
    if (geometryColumns[field.name]?.encoding !== 'geoarrow.geometry') {
      continue;
    }
    const vector = table.getChild(field.name);
    if (vector?.type instanceof arrow.DenseUnion) {
      stableColumns.set(field.name, stabilizeGeometryUnionVector(vector, geometryTypes));
    }
  }
  if (stableColumns.size === 0) return table;

  const fields = table.schema.fields.map(field => {
    const stableColumn = stableColumns.get(field.name);
    return stableColumn
      ? new arrow.Field(field.name, stableColumn.type, field.nullable, field.metadata)
      : field;
  });
  const schema = new arrow.Schema(fields, table.schema.metadata);
  let rowOffset = 0;
  const batches = table.batches.map(batch => {
    const children = fields.map(field => {
      const stableColumn = stableColumns.get(field.name);
      if (!stableColumn) return batch.getChild(field.name)!.data[0];
      const data = stableColumn.slice(rowOffset, rowOffset + batch.numRows).data[0];
      return data;
    });
    rowOffset += batch.numRows;
    return new arrow.RecordBatch(
      schema,
      arrow.makeData({
        type: new arrow.Struct(fields),
        length: batch.numRows,
        nullCount: 0,
        children
      })
    );
  });
  return new arrow.Table(schema, batches);
}

/** Adds absent, typed union children so independently converted batches share one Arrow schema. */
function stabilizeGeometryUnionVector(
  vector: arrow.Vector,
  geometryTypes: readonly GeoParquetGeometryType[]
): arrow.Vector {
  const sourceType = vector.type as arrow.DenseUnion;
  const stableChildren = geometryTypes
    .map(geometryType => getStableUnionChild(geometryType))
    .filter((child): child is StableUnionChild => child !== null);
  const fields: arrow.Field[] = [];
  const childTypes: arrow.DataType[] = [];
  const sourceChildIndexes = new Map<number, number>();

  for (const child of stableChildren) {
    const sourceChildIndex = sourceType.typeIds.indexOf(child.typeId);
    const sourceField = sourceChildIndex >= 0 ? sourceType.children[sourceChildIndex] : undefined;
    const type = sourceField?.type || createEmptyNativeType(child.kind, child.dimension);
    fields.push(new arrow.Field(child.name, type, true));
    childTypes.push(type);
    sourceChildIndexes.set(child.typeId, sourceChildIndex);
  }

  const stableType = new arrow.DenseUnion(
    Int32Array.from(stableChildren.map(child => child.typeId)),
    fields
  );
  const chunks = vector.data.map(data => {
    const children = stableChildren.map((child, childIndex) => {
      const sourceChildIndex = sourceChildIndexes.get(child.typeId) ?? -1;
      return sourceChildIndex >= 0
        ? data.children[sourceChildIndex]
        : createEmptyData(childTypes[childIndex]);
    });
    return new arrow.Data(
      stableType,
      data.offset,
      data.length,
      data.nullCount,
      {
        [arrow.BufferType.VALIDITY]: data.nullBitmap,
        [arrow.BufferType.TYPE]: data.typeIds,
        [arrow.BufferType.OFFSET]: data.valueOffsets
      },
      children
    );
  });
  return new arrow.Vector(chunks);
}

type StableUnionChild = {
  /** Geometry family represented by the union child. */
  kind: GeoArrowUnionGeometryKind;
  /** Coordinate dimension represented by the union child. */
  dimension: GeoArrowDimension;
  /** Dense-union type ID assigned to the child. */
  typeId: number;
  /** Arrow field name used for the child. */
  name: string;
};

/** Resolves a canonical dense-union child descriptor for a GeoParquet geometry type. */
function getStableUnionChild(geometryType: GeoParquetGeometryType): StableUnionChild | null {
  const kind = geometryType.replace(/ (?:ZM|Z|M)$/, '') as GeoArrowUnionGeometryKind;
  if (
    ![
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
      'GeometryCollection'
    ].includes(kind)
  ) {
    return null;
  }
  const dimension = geometryType.endsWith(' ZM')
    ? 'xyzm'
    : geometryType.endsWith(' Z')
      ? 'xyz'
      : geometryType.endsWith(' M')
        ? 'xym'
        : 'xy';
  const familyIndex = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ].indexOf(kind);
  const dimensionIndex = ['xy', 'xyz', 'xym', 'xyzm'].indexOf(dimension);
  return {kind, dimension, typeId: familyIndex * 4 + dimensionIndex + 1, name: geometryType};
}

/** Creates the physical Arrow type used for an empty stable-union child. */
function createEmptyNativeType(
  kind: GeoArrowUnionGeometryKind,
  dimension: GeoArrowDimension
): arrow.DataType {
  const size = dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
  let coordinateType: arrow.DataType = new arrow.FixedSizeList(
    size,
    new arrow.Field('value', new arrow.Float64(), true)
  );
  const depth =
    kind === 'Point'
      ? 0
      : kind === 'LineString' || kind === 'MultiPoint'
        ? 1
        : kind === 'Polygon' || kind === 'MultiLineString'
          ? 2
          : 3;
  for (let level = 0; level < depth; level++) {
    coordinateType = new arrow.List(new arrow.Field('value', coordinateType, true));
  }
  if (kind === 'GeometryCollection') {
    const nestedTypes = GEOARROW_GEOMETRY_TYPES.filter(
      geometryType => !geometryType.startsWith('GeometryCollection')
    )
      .map(getStableUnionChild)
      .filter((child): child is StableUnionChild => child !== null);
    const nestedFields = nestedTypes.map(
      child => new arrow.Field(child.name, createEmptyNativeType(child.kind, child.dimension), true)
    );
    const nestedType = new arrow.DenseUnion(
      Int32Array.from(nestedTypes.map(child => child.typeId)),
      nestedFields
    );
    coordinateType = new arrow.List(new arrow.Field('geometries', nestedType, true));
  }
  return coordinateType;
}

/** Creates an empty Arrow data node while retaining the child type recursively. */
function createEmptyData(type: arrow.DataType): arrow.Data {
  if (type instanceof arrow.FixedSizeList) {
    return new arrow.Data(type, 0, 0, 0, {}, [createEmptyData(type.children[0].type)]);
  }
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    const offsets = type instanceof arrow.LargeList ? new BigInt64Array([0n]) : new Int32Array([0]);
    return new arrow.Data(type, 0, 0, 0, {[arrow.BufferType.OFFSET]: offsets}, [
      createEmptyData(type.children[0].type)
    ]);
  }
  if (type instanceof arrow.Struct) {
    return new arrow.Data(
      type,
      0,
      0,
      0,
      {},
      type.children.map(child => createEmptyData(child.type))
    );
  }
  if (type instanceof arrow.DenseUnion) {
    return new arrow.Data(
      type,
      0,
      0,
      0,
      {[arrow.BufferType.TYPE]: new Int8Array(0), [arrow.BufferType.OFFSET]: new Int32Array(0)},
      type.children.map(child => createEmptyData(child.type))
    );
  }
  if (arrow.DataType.isFloat(type)) {
    const values =
      type instanceof arrow.Float && type.precision === arrow.Precision.SINGLE
        ? new Float32Array(0)
        : new Float64Array(0);
    return new arrow.Data(type, 0, 0, 0, {[arrow.BufferType.DATA]: values});
  }
  throw new Error(`Cannot create an empty Arrow child for ${type.toString()}`);
}

/** Selects a stable union seed only when the stream cannot trust geometry-type metadata. */
function getStableGeometryTypes(
  table: arrow.Table,
  targetEncoding: GeoArrowGeometryTarget,
  options: GeoArrowStreamConvertOptions
): readonly GeoParquetGeometryType[] | undefined {
  if (
    options.geometryTypes ||
    (targetEncoding !== 'native' && targetEncoding !== 'geoarrow.geometry')
  ) {
    return undefined;
  }

  const geometryColumns = getGeometryColumnsFromSchema(table.schema);
  const geoMetadata = getGeoMetadata(table.schema.metadata || new Map());
  const selectedColumns = getSelectedGeometryColumns(geometryColumns, options);
  const hasUnknownSerializedGeometry = selectedColumns.some(columnName => {
    const fieldMetadata = geometryColumns[columnName];
    const fileMetadata = geoMetadata?.columns?.[columnName];
    const encoding = fieldMetadata?.encoding;
    return (
      (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') &&
      !hasGeometryTypes(fieldMetadata, fileMetadata)
    );
  });
  return hasUnknownSerializedGeometry ? createStableGeometryTypes(options.dimension) : undefined;
}

/** Resolves selected geometry fields using the same column options as table conversion. */
function getSelectedGeometryColumns(
  geometryColumns: Record<string, GeoArrowMetadata>,
  options: GeoArrowStreamConvertOptions
): string[] {
  if (options.geometryColumn) return [options.geometryColumn];
  if (options.geometryColumns?.length) return [...options.geometryColumns];
  return Object.keys(geometryColumns);
}

/** Returns whether either field or file metadata declares geometry families. */
function hasGeometryTypes(
  fieldMetadata: GeoArrowMetadata | undefined,
  fileMetadata: GeoMetadata['columns'][string] | undefined
): boolean {
  return Boolean(
    (fieldMetadata?.geometry_types && fieldMetadata.geometry_types.length > 0) ||
      (fileMetadata?.geometry_types && fileMetadata.geometry_types.length > 0)
  );
}

/** Creates all canonical family/dimension descriptors used by an unknown stream union. */
function createStableGeometryTypes(
  dimension?: GeoArrowDimension
): readonly GeoParquetGeometryType[] {
  const dimensions = dimension ? [dimension] : (['xy', 'xyz', 'xym', 'xyzm'] as const);
  return GEOARROW_GEOMETRY_TYPES.flatMap(geometryType =>
    dimensions.map(currentDimension => {
      const suffix =
        currentDimension === 'xy'
          ? ''
          : currentDimension === 'xyz'
            ? ' Z'
            : currentDimension === 'xym'
              ? ' M'
              : ' ZM';
      return `${geometryType}${suffix}` as GeoParquetGeometryType;
    })
  );
}

/** Produces a platform-neutral cancellation exception. */
function createAbortError(): Error {
  const error = new Error('GeoArrow batch conversion was aborted.');
  error.name = 'AbortError';
  return error;
}
