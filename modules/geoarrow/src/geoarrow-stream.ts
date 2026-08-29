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
    yield {
      ...batch,
      data: convertedTable,
      schema: convertArrowToSchema(convertedTable.schema),
      length: convertedTable.numRows
    };
  }
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
