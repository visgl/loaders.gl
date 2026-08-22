// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getGeoMetadata} from '@loaders.gl/gis';

import type {
  ParquetBoundingBox,
  ParquetPredicate,
  ParquetSourceMetadata
} from '../../parquet-source-types';

type GeoParquetBoundingBoxCovering = {
  /** Parquet schema path containing the per-row minimum x coordinate. */
  xmin: readonly [string, 'xmin'];
  /** Parquet schema path containing the per-row minimum y coordinate. */
  ymin: readonly [string, 'ymin'];
  /** Parquet schema path containing the per-row maximum x coordinate. */
  xmax: readonly [string, 'xmax'];
  /** Parquet schema path containing the per-row maximum y coordinate. */
  ymax: readonly [string, 'ymax'];
};

/**
 * Creates an exact per-row bounding-box predicate from GeoParquet 1.1 covering metadata.
 *
 * Invalid, missing, unsupported, or antimeridian-crossing coverings return `undefined` so spatial
 * filtering remains conservative. GeoParquet 1.1 explicitly excludes antimeridian-crossing
 * geometries from its bounding-box covering technique.
 */
export function createGeoParquetBoundingBoxPredicate(
  metadata: ParquetSourceMetadata,
  bbox: ParquetBoundingBox,
  geometryColumn?: string
): ParquetPredicate | undefined {
  const bounds = getBoundingBoxCoordinates(bbox);
  if (!bounds) {
    return undefined;
  }
  const geoMetadata = getGeoMetadata(metadata.schema.metadata);
  const selectedGeometryColumn = geometryColumn || geoMetadata?.primary_column;
  const columnMetadata = selectedGeometryColumn
    ? geoMetadata?.columns?.[selectedGeometryColumn]
    : undefined;
  const covering = getBoundingBoxCovering(columnMetadata?.covering);
  if (!covering || !hasCoveringColumns(metadata, covering)) {
    return undefined;
  }

  return {
    op: 'and',
    args: [
      {op: '<=', args: [{property: covering.xmin}, bounds.east]},
      {op: '>=', args: [{property: covering.xmax}, bounds.west]},
      {op: '<=', args: [{property: covering.ymin}, bounds.north]},
      {op: '>=', args: [{property: covering.ymax}, bounds.south]}
    ]
  };
}

/** Combines an application predicate with an optional GeoParquet covering predicate. */
export function combineParquetPredicates(
  predicate: ParquetPredicate | undefined,
  spatialPredicate: ParquetPredicate | undefined
): ParquetPredicate | undefined {
  if (!predicate) {
    return spatialPredicate;
  }
  if (!spatialPredicate) {
    return predicate;
  }
  return {op: 'and', args: [predicate, spatialPredicate]};
}

/** Validates the normative GeoParquet 1.1 two-level bbox covering representation. */
function getBoundingBoxCovering(value: unknown): GeoParquetBoundingBoxCovering | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const bbox = (value as {bbox?: unknown}).bbox;
  if (!bbox || typeof bbox !== 'object') {
    return undefined;
  }
  const candidate = bbox as Record<string, unknown>;
  const xmin = getCoveringPath(candidate.xmin, 'xmin');
  const ymin = getCoveringPath(candidate.ymin, 'ymin');
  const xmax = getCoveringPath(candidate.xmax, 'xmax');
  const ymax = getCoveringPath(candidate.ymax, 'ymax');
  if (!xmin || !ymin || !xmax || !ymax) {
    return undefined;
  }
  const rootColumn = xmin[0];
  if (ymin[0] !== rootColumn || xmax[0] !== rootColumn || ymax[0] !== rootColumn) {
    return undefined;
  }
  return {xmin, ymin, xmax, ymax};
}

/** Validates one GeoParquet 1.1 bbox leaf path. */
function getCoveringPath<T extends 'xmin' | 'ymin' | 'xmax' | 'ymax'>(
  value: unknown,
  expectedLeaf: T
): readonly [string, T] | undefined {
  return Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    value[0].length > 0 &&
    value[1] === expectedLeaf
    ? [value[0], expectedLeaf]
    : undefined;
}

/** Ensures every covering path resolves to a physical column in the Parquet footer. */
function hasCoveringColumns(
  metadata: ParquetSourceMetadata,
  covering: GeoParquetBoundingBoxCovering
): boolean {
  const availablePaths = new Set(
    metadata.rowGroups.flatMap(rowGroup => rowGroup.columns.map(column => column.path.join('\0')))
  );
  return Object.values(covering).every(path => availablePaths.has(path.join('\0')));
}

/** Validates and normalizes the two horizontal dimensions of a query bounding box. */
function getBoundingBoxCoordinates(
  bbox: ParquetBoundingBox
): {west: number; south: number; east: number; north: number} | undefined {
  const west = bbox[0];
  const south = bbox[1];
  const east = bbox.length === 6 ? bbox[3] : bbox[2];
  const north = bbox.length === 6 ? bbox[4] : bbox[3];
  if (![west, south, east, north].every(Number.isFinite) || west > east || south > north) {
    return undefined;
  }
  return {west, south, east, north};
}
