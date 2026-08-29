// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, GeoArrowEncoding, Geometry} from '@loaders.gl/schema';
import {
  convertGeoArrowGeometry,
  getGeoArrowNativeGeometry,
  convertGeoArrowVectorCellToGeoJSON,
  getGeoArrowBounds,
  getGeoArrowFieldInfo,
  getGeoArrowRowBounds
} from '@loaders.gl/geoarrow';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {selectArrowTableRows} from '@loaders.gl/schema-utils';
import type {ArrowQueryOptions} from '@loaders.gl/sql';
import {
  evaluateNativeSpatialPredicate,
  evaluateSpatialPredicate,
  getSpatialGeometryDistance,
  makeSpatialBoundingBoxGeometry,
  measureSpatialGeometry
} from './spatial-kernels';

/** Spatial predicates understood by the Scan planning layer. */
export type SpatialPredicate =
  | 'bbox-intersects'
  | 'contains'
  | 'covered-by'
  | 'covers'
  | 'crosses'
  | 'dwithin'
  | 'disjoint'
  | 'equals'
  | 'intersects'
  | 'overlaps'
  | 'touches'
  | 'within';

/** One geometry predicate in a spatial query plan. */
export type SpatialExpression = Readonly<{
  /** Geometry column evaluated by the predicate. */
  geometryColumn: string;
  /** Spatial relationship to evaluate. */
  predicate: SpatialPredicate;
  /** Query geometry for exact predicates. */
  geometry?: Geometry;
  /** Query extent in minX, minY, maxX, maxY order. */
  bbox?: readonly [number, number, number, number];
  /** Search radius for distance-aware predicates. */
  distance?: number;
}>;

/** Aggregate over a geometry column or a spatially filtered group. */
export type SpatialAggregate = Readonly<{
  /** Aggregate output name. */
  as: string;
  /** Aggregate function. */
  function: 'area' | 'count' | 'distance' | 'length';
  /** Geometry column consumed by the aggregate, when applicable. */
  geometryColumn?: string;
  /** Optional target geometry used by the distance aggregate. */
  geometry?: Geometry;
}>;

/** Join condition between geometry columns from two Scan inputs. */
export type SpatialJoin = Readonly<{
  /** Left input geometry column. */
  leftGeometryColumn: string;
  /** Right input geometry column. */
  rightGeometryColumn: string;
  /** Spatial relationship used for matching rows. */
  predicate: SpatialPredicate;
  /** Search radius for distance-aware joins. */
  distance?: number;
}>;

/** Output and resource controls for a spatial join. */
export type SpatialJoinOptions = Readonly<{
  /** Prefix applied to left input fields in the result. Defaults to `left_`. */
  leftPrefix?: string;
  /** Prefix applied to right input fields in the result. Defaults to `right_`. */
  rightPrefix?: string;
  /** Maximum number of matching row pairs to materialize. */
  limit?: number;
}>;

/** Query options shared by relational and spatial Arrow execution. */
export type SpatialQueryOptions = Omit<ArrowQueryOptions, 'aggregates' | 'join'> &
  Readonly<{
    /** Spatial predicates evaluated before projection and limit. */
    spatial?: SpatialExpression | readonly SpatialExpression[];
    /** Optional grouped spatial aggregates. */
    aggregates?: readonly SpatialAggregate[];
    /** Optional spatial join specification for a two-input plan. */
    join?: SpatialJoin;
  }>;

/** Execution handoff from the Scan planner to a spatial backend. */
export type SpatialExecutionPlan = Readonly<{
  /** Input table with native GeoArrow preparation only where coordinates are required. */
  table: ArrowTable;
  /** Geometry columns converted for coordinate execution. */
  nativeGeometryColumns: readonly string[];
  /** Spatial expressions to evaluate in the backend. */
  expressions: readonly SpatialExpression[];
}>;

/** One explainable stage in a spatial Scan plan. */
export type SpatialPlanStage = Readonly<{
  /** Planner stage identifier. */
  kind: 'source' | 'native-conversion' | 'bounds-pruning' | 'residual' | 'aggregate' | 'projection';
  /** Geometry columns or expressions consumed by the stage. */
  columns?: readonly string[];
  /** Human-readable reason for the stage. */
  detail: string;
}>;

/** Explain-only representation of the work a spatial Scan will perform. */
export type SpatialPlanExplanation = Readonly<{
  /** Geometry columns that will be converted once for the plan. */
  nativeGeometryColumns: readonly string[];
  /** Ordered logical stages, without reading geometry values. */
  stages: readonly SpatialPlanStage[];
}>;

/** Result of one vectorized spatial query over an Arrow table. */
export type SpatialQueryResult = Readonly<{
  /** Filtered and projected Arrow table. */
  table: ArrowTable;
  /** Number of rows retained before projection and limit. */
  matchedRows: number;
  /** Whether all predicates were evaluated using exact geometry operations. */
  exact: boolean;
}>;

/** Result of a spatial join, including candidate accounting for plan diagnostics. */
export type SpatialJoinResult = Readonly<{
  /** Joined rows with prefixed left and right fields. */
  table: ArrowTable;
  /** Number of row pairs retained after the spatial predicate. */
  matchedPairs: number;
  /** Number of row pairs that survived the envelope candidate stage. */
  candidatePairs: number;
  /** Whether every retained pair was evaluated by the exact predicate. */
  exact: boolean;
}>;

/**
 * Explains a spatial Arrow plan without converting or decoding geometry values.
 *
 * @param table Source Arrow table.
 * @param options Spatial query options.
 * @returns Ordered planner stages and the geometry conversion set.
 */
export function explainSpatialQuery(
  table: ArrowTable,
  options: SpatialQueryOptions = {}
): SpatialPlanExplanation {
  const expressions = normalizeSpatialExpressions(options.spatial);
  const nativeGeometryColumns = getSpatialCoordinateColumns(expressions, options.aggregates);
  const stages: SpatialPlanStage[] = [
    {
      kind: 'source',
      detail: `Read Arrow table with ${table.data.numRows} rows.`
    }
  ];
  if (nativeGeometryColumns.length > 0) {
    stages.push({
      kind: 'native-conversion',
      columns: nativeGeometryColumns,
      detail: 'Convert referenced geometry columns to adaptive native GeoArrow once per plan.'
    });
  }
  if (expressions.length > 0) {
    stages.push({
      kind: 'bounds-pruning',
      columns: [...new Set(expressions.map(expression => expression.geometryColumn))],
      detail: 'Inspect GeoArrow bounds and apply conservative envelope pruning.'
    });
    const residualExpressions = expressions.filter(
      expression => expression.predicate !== 'bbox-intersects'
    );
    if (residualExpressions.length > 0) {
      stages.push({
        kind: 'residual',
        columns: [...new Set(residualExpressions.map(expression => expression.geometryColumn))],
        detail: 'Decode only candidate geometries for exact residual predicates.'
      });
    }
  }
  if (options.aggregates?.length) {
    stages.push({kind: 'aggregate', detail: 'Evaluate spatial aggregates after filtering.'});
  }
  if (options.columns || options.limit !== undefined) {
    stages.push({kind: 'projection', detail: 'Project requested columns and apply the row limit.'});
  }
  return {nativeGeometryColumns, stages};
}

/**
 * Prepares the geometry columns needed by a spatial Arrow plan.
 *
 * Conversion happens once for coordinate-requiring operators and leaves bounds-only plans in
 * their compact source encoding. Spatial backends can retain the returned table while evaluating
 * multiple predicates and aggregates over the same batches.
 *
 * @param table Source Arrow table.
 * @param options Spatial query options.
 * @returns Prepared Arrow table and the columns converted to native GeoArrow.
 */
export function prepareSpatialArrowTable(
  table: ArrowTable,
  options: SpatialQueryOptions
): SpatialExecutionPlan {
  const expressions = normalizeSpatialExpressions(options.spatial);
  const nativeGeometryColumns = getSpatialCoordinateColumns(expressions, options.aggregates);
  if (nativeGeometryColumns.length === 0) {
    return {table, nativeGeometryColumns, expressions};
  }

  return {
    table: {
      ...table,
      data: convertGeoArrowGeometry(table.data, 'native', {
        geometryColumns: [...nativeGeometryColumns]
      })
    },
    nativeGeometryColumns,
    expressions
  };
}

/**
 * Executes the bbox stage of a spatial Arrow query using native GeoArrow bounds.
 *
 * Bbox predicates use native bounds. Exact predicates use a native-to-geometry residual decoder
 * only for rows surviving the query envelope. Multiple spatial expressions are combined with AND
 * semantics. Aggregates execute after filtering and return a one-row Arrow table.
 *
 * @param table Source Arrow table.
 * @param options Spatial query options.
 * @returns Filtered Arrow table and execution accounting.
 */
export function executeSpatialQuery(
  table: ArrowTable,
  options: SpatialQueryOptions = {}
): SpatialQueryResult {
  const plan = prepareSpatialArrowTable(table, options);
  if (plan.expressions.length === 0) {
    const allRows = allRowIndices(plan.table.data.numRows);
    if (options.aggregates?.length) {
      return {
        table: createSpatialAggregateTable(plan.table, allRows, options.aggregates),
        matchedRows: plan.table.data.numRows,
        exact: true
      };
    }
    return {
      table: selectArrowTableRows(plan.table, allRows, options.columns, options.limit),
      matchedRows: plan.table.data.numRows,
      exact: true
    };
  }

  let selectedRowIndices = allRowIndices(plan.table.data.numRows);
  const rowBoundsByColumn = new Map<
    string,
    readonly (readonly [number, number, number, number] | null)[]
  >();
  const geometryCacheByColumn = new Map<string, Map<number, Geometry | null>>();
  const nativeGeometryCacheByColumn = new Map<
    string,
    Map<number, ReturnType<typeof getGeoArrowNativeGeometry>>
  >();
  let exact = true;
  for (const expression of plan.expressions) {
    validateSpatialDistance(expression);
    const queryBounds = getExpressionBounds(expression);
    const candidateBounds =
      expression.predicate === 'dwithin'
        ? expandBounds(queryBounds, expression.distance!)
        : queryBounds;
    const field = plan.table.data.schema.fields.find(
      candidate => candidate.name === expression.geometryColumn
    );
    if (!field)
      throw new Error(
        `Spatial query could not find geometry column "${expression.geometryColumn}".`
      );
    const fieldInfo = getGeoArrowFieldInfo(field);
    if (!fieldInfo?.encoding) {
      throw new Error(
        `Spatial query could not resolve encoding for "${expression.geometryColumn}".`
      );
    }
    const vector = plan.table.data.getChild(expression.geometryColumn);
    if (!vector)
      throw new Error(
        `Spatial query could not read geometry column "${expression.geometryColumn}".`
      );
    let rowBounds = rowBoundsByColumn.get(expression.geometryColumn);
    if (!rowBounds) {
      rowBounds = getGeoArrowRowBounds(vector, fieldInfo.encoding);
      rowBoundsByColumn.set(expression.geometryColumn, rowBounds);
    }
    selectedRowIndices = selectedRowIndices.filter(rowIndex => {
      const bounds = rowBounds[rowIndex];
      if (!bounds) return false;
      if (!boundsIntersect(bounds, candidateBounds)) {
        // Non-overlapping envelopes prove disjointness without decoding the geometry. Other
        // predicates are false because their required intersection is impossible.
        return expression.predicate === 'disjoint';
      }
      if (expression.predicate === 'bbox-intersects') {
        exact = false;
        return true;
      }
      const queryGeometry = getExpressionGeometry(expression);
      const rowValue = vector.get(rowIndex);
      if (expression.predicate !== 'dwithin') {
        const nativeGeometry = getCachedNativeSpatialQueryGeometry(
          vector,
          rowIndex,
          fieldInfo.encoding!,
          nativeGeometryCacheByColumn,
          expression.geometryColumn
        );
        if (nativeGeometry) {
          const nativeResult = evaluateNativeSpatialPredicate(
            nativeGeometry,
            expression.predicate,
            queryGeometry
          );
          if (nativeResult !== null) return nativeResult;
        }
      }
      const rowGeometry = getCachedSpatialQueryGeometry(
        vector,
        rowIndex,
        fieldInfo.encoding!,
        geometryCacheByColumn,
        expression.geometryColumn
      );
      if (expression.predicate === 'dwithin') {
        return Boolean(
          rowValue &&
            rowGeometry &&
            queryGeometry &&
            getSpatialGeometryDistance(rowGeometry, queryGeometry) <= expression.distance!
        );
      }
      return Boolean(
        rowValue &&
          rowGeometry &&
          queryGeometry &&
          evaluateSpatialPredicate(rowGeometry, expression.predicate, queryGeometry)
      );
    });
  }

  if (options.aggregates?.length) {
    return {
      table: createSpatialAggregateTable(plan.table, selectedRowIndices, options.aggregates),
      matchedRows: selectedRowIndices.length,
      exact
    };
  }

  return {
    table: selectArrowTableRows(plan.table, selectedRowIndices, options.columns, options.limit),
    matchedRows: selectedRowIndices.length,
    exact
  };
}

/**
 * Executes a spatial join over two Arrow tables.
 *
 * Each input geometry column is converted to adaptive native GeoArrow once. The right-hand
 * envelopes are sorted into an interval index, so ordinary predicates decode only candidate
 * pairs. Disjoint joins use the conservative complement of the index and evaluate overlaps
 * exactly. Result fields are prefixed to make collisions explicit while retaining their Arrow
 * physical types and field metadata.
 *
 * @param leftTable Left Arrow table.
 * @param rightTable Right Arrow table.
 * @param join Spatial relationship and geometry columns.
 * @param options Output prefixes and optional pair limit.
 * @returns Joined Arrow table and execution accounting.
 */
export function executeSpatialJoin(
  leftTable: ArrowTable,
  rightTable: ArrowTable,
  join: SpatialJoin,
  options: SpatialJoinOptions = {}
): SpatialJoinResult {
  if (join.distance !== undefined && (!Number.isFinite(join.distance) || join.distance < 0)) {
    throw new Error('Spatial join distance must be a finite non-negative number.');
  }
  if (join.predicate === 'dwithin' && join.distance === undefined) {
    throw new Error('Spatial join dwithin requires a finite non-negative distance.');
  }
  const requiresCoordinates = join.predicate !== 'bbox-intersects';
  const left = prepareSpatialJoinTable(leftTable, join.leftGeometryColumn, requiresCoordinates);
  const right = prepareSpatialJoinTable(rightTable, join.rightGeometryColumn, requiresCoordinates);
  const leftVector = getSpatialJoinGeometryVector(left, join.leftGeometryColumn, 'left');
  const rightVector = getSpatialJoinGeometryVector(right, join.rightGeometryColumn, 'right');
  const leftEncoding = getSpatialJoinEncoding(left, join.leftGeometryColumn, 'left');
  const rightEncoding = getSpatialJoinEncoding(right, join.rightGeometryColumn, 'right');
  const leftBounds = getGeoArrowRowBounds(leftVector, leftEncoding);
  const rightBounds = getGeoArrowRowBounds(rightVector, rightEncoding);
  const rightIndex = new SpatialBoundsIndex(rightBounds);
  const leftGeometryCache = new Map<number, Geometry | null>();
  const rightGeometryCache = new Map<number, Geometry | null>();
  const leftNativeGeometryCache = new Map<number, ReturnType<typeof getGeoArrowNativeGeometry>>();
  const rightNativeGeometryCache = new Map<number, ReturnType<typeof getGeoArrowNativeGeometry>>();
  const pairs: Array<readonly [number, number]> = [];
  let candidatePairs = 0;
  let exact = true;
  const pairLimit = options.limit ?? Number.POSITIVE_INFINITY;
  if (options.limit !== undefined && (!Number.isSafeInteger(options.limit) || options.limit < 0)) {
    throw new Error('Spatial join limit must be a non-negative safe integer.');
  }
  if (pairLimit === 0) {
    return {
      table: createSpatialJoinTable(
        left,
        right,
        [],
        options,
        join.leftGeometryColumn,
        join.rightGeometryColumn
      ),
      matchedPairs: 0,
      candidatePairs: 0,
      exact: join.predicate !== 'bbox-intersects'
    };
  }

  for (let leftRowIndex = 0; leftRowIndex < left.data.numRows; leftRowIndex++) {
    const leftRowBounds = leftBounds[leftRowIndex];
    if (!leftRowBounds) continue;
    const candidateBounds = expandBounds(leftRowBounds, join.distance || 0);
    const candidateRightRows =
      join.predicate === 'disjoint'
        ? allRowIndices(right.data.numRows)
        : rightIndex.query(candidateBounds);
    for (const rightRowIndex of candidateRightRows) {
      const rightRowBounds = rightBounds[rightRowIndex];
      if (!rightRowBounds) continue;
      const envelopesIntersect = boundsIntersect(
        join.distance === undefined ? leftRowBounds : candidateBounds,
        rightRowBounds
      );
      if (join.predicate !== 'disjoint' && !envelopesIntersect) continue;
      candidatePairs++;
      let matches: boolean;
      if (join.predicate === 'bbox-intersects') {
        matches = envelopesIntersect;
        exact = false;
      } else if (join.distance !== undefined) {
        const leftGeometry = getCachedSpatialJoinGeometry(
          leftVector,
          leftRowIndex,
          getSpatialJoinEncoding(left, join.leftGeometryColumn, 'left'),
          leftGeometryCache
        );
        const rightGeometry = getCachedSpatialJoinGeometry(
          rightVector,
          rightRowIndex,
          getSpatialJoinEncoding(right, join.rightGeometryColumn, 'right'),
          rightGeometryCache
        );
        matches = Boolean(
          leftGeometry &&
            rightGeometry &&
            getSpatialGeometryDistance(leftGeometry, rightGeometry) <= join.distance
        );
      } else if (join.predicate === 'disjoint' && !envelopesIntersect) {
        matches = true;
      } else {
        const leftNativeGeometry = getCachedSpatialJoinNativeGeometry(
          leftVector,
          leftRowIndex,
          leftEncoding,
          leftNativeGeometryCache
        );
        const rightNativeGeometry = getCachedSpatialJoinNativeGeometry(
          rightVector,
          rightRowIndex,
          rightEncoding,
          rightNativeGeometryCache
        );
        const nativeResult =
          leftNativeGeometry && rightNativeGeometry
            ? evaluateNativeSpatialPredicate(
                leftNativeGeometry,
                join.predicate,
                rightNativeGeometry
              )
            : null;
        if (nativeResult !== null) {
          matches = nativeResult;
        } else {
          const leftGeometry = getCachedSpatialJoinGeometry(
            leftVector,
            leftRowIndex,
            leftEncoding,
            leftGeometryCache
          );
          const rightGeometry = getCachedSpatialJoinGeometry(
            rightVector,
            rightRowIndex,
            rightEncoding,
            rightGeometryCache
          );
          matches = Boolean(
            leftGeometry &&
              rightGeometry &&
              evaluateSpatialPredicate(leftGeometry, join.predicate, rightGeometry)
          );
        }
      }
      if (matches) {
        pairs.push([leftRowIndex, rightRowIndex]);
        if (pairs.length >= pairLimit) break;
      }
    }
    if (pairs.length >= pairLimit) break;
  }

  return {
    table: createSpatialJoinTable(
      left,
      right,
      pairs,
      options,
      join.leftGeometryColumn,
      join.rightGeometryColumn
    ),
    matchedPairs: pairs.length,
    candidatePairs,
    exact
  };
}

/** Normalizes the ergonomic single-expression form to a readonly list. */
function normalizeSpatialExpressions(
  spatial: SpatialQueryOptions['spatial']
): readonly SpatialExpression[] {
  if (!spatial) {
    return [];
  }
  if (Array.isArray(spatial)) {
    return spatial as readonly SpatialExpression[];
  }
  return [spatial as SpatialExpression];
}

function getExpressionBounds(
  expression: SpatialExpression
): readonly [number, number, number, number] {
  if (expression.bbox) return expression.bbox;
  if (expression.geometry) {
    const bytes = new Uint8Array(convertGeometryToWKB(expression.geometry));
    const bounds = getGeoArrowBounds(bytes, 'geoarrow.wkb');
    if (bounds) return bounds;
  }
  throw new Error('Spatial expression requires either bbox or a non-empty geometry.');
}

/** Validates radius-bearing spatial expressions before the planner touches source rows. */
function validateSpatialDistance(expression: SpatialExpression): void {
  if (
    expression.distance !== undefined &&
    (!Number.isFinite(expression.distance) || expression.distance < 0)
  ) {
    throw new Error('Spatial expression distance must be a finite non-negative number.');
  }
  if (expression.predicate === 'dwithin' && expression.distance === undefined) {
    throw new Error('Spatial expression dwithin requires a finite non-negative distance.');
  }
}

/** Resolves the exact query geometry, treating a bbox as a closed rectangle. */
function getExpressionGeometry(expression: SpatialExpression): Geometry {
  if (expression.geometry) return expression.geometry;
  if (expression.bbox) return makeSpatialBoundingBoxGeometry(expression.bbox);
  throw new Error(`${expression.predicate} requires either geometry or bbox.`);
}

/** Reads and caches one native geometry row for common exact residual predicates. */
function getCachedNativeSpatialQueryGeometry(
  vector: arrow.Vector,
  rowIndex: number,
  encoding: NonNullable<ReturnType<typeof getGeoArrowFieldInfo>>['encoding'],
  cacheByColumn: Map<string, Map<number, ReturnType<typeof getGeoArrowNativeGeometry>>>,
  geometryColumn: string
): ReturnType<typeof getGeoArrowNativeGeometry> {
  let columnCache = cacheByColumn.get(geometryColumn);
  if (!columnCache) {
    columnCache = new Map<number, ReturnType<typeof getGeoArrowNativeGeometry>>();
    cacheByColumn.set(geometryColumn, columnCache);
  }
  if (columnCache.has(rowIndex)) return columnCache.get(rowIndex) || null;
  const geometry = encoding ? getGeoArrowNativeGeometry(vector, rowIndex, encoding) : null;
  columnCache.set(rowIndex, geometry);
  return geometry;
}

/** Decodes one native GeoArrow cell for a residual exact predicate or aggregate. */
function getVectorCellGeometry(
  vector: arrow.Vector,
  rowIndex: number,
  encoding: NonNullable<ReturnType<typeof getGeoArrowFieldInfo>>['encoding']
): Geometry | null {
  if (!encoding || encoding === 'geoarrow.box') {
    const bounds = getGeoArrowBounds(vector.get(rowIndex), encoding || 'geoarrow.box');
    return bounds ? makeSpatialBoundingBoxGeometry(bounds) : null;
  }
  return convertGeoArrowVectorCellToGeoJSON(vector, rowIndex, encoding);
}

/** Decodes one residual geometry at most once across all expressions in a query plan. */
function getCachedSpatialQueryGeometry(
  vector: arrow.Vector,
  rowIndex: number,
  encoding: NonNullable<ReturnType<typeof getGeoArrowFieldInfo>>['encoding'],
  cacheByColumn: Map<string, Map<number, Geometry | null>>,
  geometryColumn: string
): Geometry | null {
  let columnCache = cacheByColumn.get(geometryColumn);
  if (!columnCache) {
    columnCache = new Map<number, Geometry | null>();
    cacheByColumn.set(geometryColumn, columnCache);
  }
  if (columnCache.has(rowIndex)) return columnCache.get(rowIndex) || null;
  const geometry = getVectorCellGeometry(vector, rowIndex, encoding);
  columnCache.set(rowIndex, geometry);
  return geometry;
}

/** Computes declared spatial aggregates over the selected native geometry rows. */
function createSpatialAggregateTable(
  table: ArrowTable,
  rowIndices: readonly number[],
  aggregates: readonly SpatialAggregate[]
): ArrowTable {
  const nativeGeometryCache = new Map<string, ReturnType<typeof getGeoArrowNativeGeometry>[]>();
  const values: Record<string, number[]> = {};
  for (const aggregate of aggregates) {
    if (aggregate.function === 'count') {
      const geometryVector = aggregate.geometryColumn
        ? table.data.getChild(aggregate.geometryColumn)
        : null;
      if (aggregate.geometryColumn && !geometryVector) {
        throw new Error(
          `Spatial aggregate could not resolve geometry column "${aggregate.geometryColumn}".`
        );
      }
      values[aggregate.as] = [
        geometryVector
          ? rowIndices.filter(rowIndex => geometryVector.get(rowIndex) !== null).length
          : rowIndices.length
      ];
      continue;
    }
    if (!aggregate.geometryColumn) {
      throw new Error(`${aggregate.function} aggregate requires geometryColumn.`);
    }
    if (aggregate.function === 'distance') {
      if (!aggregate.geometry) {
        throw new Error('distance aggregate requires a target geometry.');
      }
      const geometries = getNativeSpatialGeometryValues(
        table,
        aggregate.geometryColumn,
        nativeGeometryCache
      );
      values[aggregate.as] = [
        sumSelectedRows(rowIndices, rowIndex => {
          const geometry = geometries[rowIndex];
          return geometry ? getSpatialGeometryDistance(geometry, aggregate.geometry!) : 0;
        })
      ];
      continue;
    }
    const geometries = getNativeSpatialGeometryValues(
      table,
      aggregate.geometryColumn,
      nativeGeometryCache
    );
    values[aggregate.as] = [
      sumSelectedRows(rowIndices, rowIndex => {
        const geometry = geometries[rowIndex];
        if (!geometry) return 0;
        const measurement = aggregate.function;
        if (measurement !== 'area' && measurement !== 'length') return 0;
        return measureSpatialGeometry(geometry, measurement);
      })
    ];
  }
  return {shape: 'arrow-table', data: arrow.tableFromArrays(values)};
}

/** Decodes one geometry column once for all native aggregate operators. */
function getNativeSpatialGeometryValues(
  table: ArrowTable,
  geometryColumn: string,
  cache: Map<string, ReturnType<typeof getGeoArrowNativeGeometry>[]>
): ReturnType<typeof getGeoArrowNativeGeometry>[] {
  const cached = cache.get(geometryColumn);
  if (cached) return cached;
  const field = table.data.schema.fields.find(candidate => candidate.name === geometryColumn);
  const vector = table.data.getChild(geometryColumn);
  const fieldInfo = field && getGeoArrowFieldInfo(field);
  if (!vector || !fieldInfo?.encoding) {
    throw new Error(`Spatial aggregate could not resolve geometry column "${geometryColumn}".`);
  }
  const geometries = Array.from({length: table.data.numRows}, (_value, rowIndex) =>
    getGeoArrowNativeGeometry(vector, rowIndex, fieldInfo.encoding!)
  );
  cache.set(geometryColumn, geometries);
  return geometries;
}

function sumSelectedRows(
  rowIndices: readonly number[],
  getValue: (rowIndex: number) => number
): number {
  return rowIndices.reduce((sum, rowIndex) => sum + getValue(rowIndex), 0);
}

function boundsIntersect(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number]
): boolean {
  if (left[1] > right[3] || left[3] < right[1]) return false;
  return getLongitudeIntervals(left[0], left[2]).some(firstInterval =>
    getLongitudeIntervals(right[0], right[2]).some(
      secondInterval =>
        firstInterval[0] <= secondInterval[1] && firstInterval[1] >= secondInterval[0]
    )
  );
}

/** Splits a wrapped longitude extent into ordinary intervals for conservative intersection tests. */
function getLongitudeIntervals(west: number, east: number): readonly (readonly [number, number])[] {
  return west <= east
    ? [[west, east]]
    : [
        [west, 180],
        [-180, east]
      ];
}

function allRowIndices(rowCount: number): number[] {
  return Array.from({length: rowCount}, (_value, rowIndex) => rowIndex);
}

/** Converts one table's requested geometry column to the native compute representation. */
function prepareSpatialJoinTable(
  table: ArrowTable,
  geometryColumn: string,
  requiresCoordinates: boolean
): ArrowTable {
  if (!requiresCoordinates) return table;
  return {
    ...table,
    data: convertGeoArrowGeometry(table.data, 'native', {geometryColumns: [geometryColumn]})
  };
}

/** Returns the geometry columns whose operators require coordinate access. */
function getSpatialCoordinateColumns(
  expressions: readonly SpatialExpression[],
  aggregates?: readonly SpatialAggregate[]
): readonly string[] {
  return [
    ...new Set([
      ...expressions
        .filter(expression => expression.predicate !== 'bbox-intersects')
        .map(expression => expression.geometryColumn),
      ...(aggregates || [])
        .filter(aggregate => aggregate.function !== 'count')
        .map(aggregate => aggregate.geometryColumn)
        .filter((column): column is string => Boolean(column))
    ])
  ];
}

/** Resolves one geometry vector for a spatial join and emits a side-specific diagnostic. */
function getSpatialJoinGeometryVector(
  table: ArrowTable,
  geometryColumn: string,
  side: 'left' | 'right'
): arrow.Vector {
  const vector = table.data.getChild(geometryColumn);
  if (!vector) {
    throw new Error(`Spatial join could not read ${side} geometry column "${geometryColumn}".`);
  }
  return vector;
}

/** Resolves one geometry encoding for a spatial join and emits a side-specific diagnostic. */
function getSpatialJoinEncoding(
  table: ArrowTable,
  geometryColumn: string,
  side: 'left' | 'right'
): GeoArrowEncoding {
  const field = table.data.schema.fields.find(candidate => candidate.name === geometryColumn);
  const encoding = field && getGeoArrowFieldInfo(field)?.encoding;
  if (!encoding) {
    throw new Error(`Spatial join could not resolve ${side} geometry column "${geometryColumn}".`);
  }
  return encoding;
}

/** Decodes and caches a geometry only after it survives the envelope candidate stage. */
function getCachedSpatialJoinGeometry(
  vector: arrow.Vector,
  rowIndex: number,
  encoding: GeoArrowEncoding,
  cache: Map<number, Geometry | null>
): Geometry | null {
  if (cache.has(rowIndex)) return cache.get(rowIndex) || null;
  const geometry = getVectorCellGeometry(vector, rowIndex, encoding);
  cache.set(rowIndex, geometry);
  return geometry;
}

/** Decodes and caches a native geometry only after it survives the envelope candidate stage. */
function getCachedSpatialJoinNativeGeometry(
  vector: arrow.Vector,
  rowIndex: number,
  encoding: GeoArrowEncoding,
  cache: Map<number, ReturnType<typeof getGeoArrowNativeGeometry>>
): ReturnType<typeof getGeoArrowNativeGeometry> {
  if (cache.has(rowIndex)) return cache.get(rowIndex) || null;
  const geometry = getGeoArrowNativeGeometry(vector, rowIndex, encoding);
  cache.set(rowIndex, geometry);
  return geometry;
}

/** Builds a prefixed Arrow table from left/right row pairs without coercing source field types. */
function createSpatialJoinTable(
  left: ArrowTable,
  right: ArrowTable,
  pairs: readonly (readonly [number, number])[],
  options: SpatialJoinOptions,
  leftGeometryColumn: string,
  rightGeometryColumn: string
): ArrowTable {
  const leftPrefix = options.leftPrefix ?? 'left_';
  const rightPrefix = options.rightPrefix ?? 'right_';
  const leftGeometryOutput = getSpatialJoinGeometryOutput(left, leftGeometryColumn);
  const rightGeometryOutput = getSpatialJoinGeometryOutput(right, rightGeometryColumn);
  const leftFields = left.data.schema.fields.map(
    field =>
      new arrow.Field(
        `${leftPrefix}${field.name}`,
        field.name === leftGeometryColumn ? leftGeometryOutput.vector.type : field.type,
        field.nullable,
        field.name === leftGeometryColumn ? leftGeometryOutput.metadata : field.metadata
      )
  );
  const rightFields = right.data.schema.fields.map(
    field =>
      new arrow.Field(
        `${rightPrefix}${field.name}`,
        field.name === rightGeometryColumn ? rightGeometryOutput.vector.type : field.type,
        field.nullable,
        field.name === rightGeometryColumn ? rightGeometryOutput.metadata : field.metadata
      )
  );
  const fields = [...leftFields, ...rightFields];
  if (new Set(fields.map(field => field.name)).size !== fields.length) {
    throw new Error('Spatial join output prefixes produce duplicate field names.');
  }

  const vectors = [
    ...makeSpatialJoinVectors(
      left,
      pairs,
      pair => pair[0],
      leftFields,
      leftGeometryColumn,
      leftGeometryOutput.vector
    ),
    ...makeSpatialJoinVectors(
      right,
      pairs,
      pair => pair[1],
      rightFields,
      rightGeometryColumn,
      rightGeometryOutput.vector
    )
  ];
  const schema = new arrow.Schema(fields);
  const data = arrow.makeData({
    type: new arrow.Struct(fields),
    length: pairs.length,
    nullCount: 0,
    children: vectors.map(vector => vector.data[0])
  });
  return {
    shape: 'arrow-table',
    data: new arrow.Table(schema, [new arrow.RecordBatch(schema, data)])
  };
}

/** Creates one output vector per source field while preserving its physical Arrow type. */
function makeSpatialJoinVectors(
  table: ArrowTable,
  pairs: readonly (readonly [number, number])[],
  getRowIndex: (pair: readonly [number, number]) => number,
  fields: readonly arrow.Field[],
  geometryColumn: string,
  geometryOutputVector: arrow.Vector
): arrow.Vector[] {
  return fields.map((field, fieldIndex) => {
    const sourceField = table.data.schema.fields[fieldIndex];
    const sourceVector = table.data.getChild(sourceField.name);
    if (!sourceVector)
      throw new Error(`Spatial join could not read source field "${sourceField.name}".`);
    const outputVector = sourceField.name === geometryColumn ? geometryOutputVector : sourceVector;
    return arrow.vectorFromArray(
      pairs.map(pair => outputVector.get(getRowIndex(pair))),
      field.type
    );
  });
}

type SpatialJoinGeometryOutput = Readonly<{
  vector: arrow.Vector;
  metadata: Map<string, string>;
}>;

/** Converts nested native join output to WKB while preserving GeoArrow metadata. */
function getSpatialJoinGeometryOutput(
  table: ArrowTable,
  geometryColumn: string
): SpatialJoinGeometryOutput {
  const field = table.data.schema.fields.find(candidate => candidate.name === geometryColumn);
  const vector = table.data.getChild(geometryColumn);
  const encoding = field && getGeoArrowFieldInfo(field)?.encoding;
  if (!field || !vector || !encoding) {
    throw new Error(`Spatial join could not resolve geometry column "${geometryColumn}".`);
  }
  if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.box') {
    return {vector, metadata: new Map(field.metadata || [])};
  }
  const outputVector = convertGeoArrowGeometry(table.data, 'geoarrow.wkb', {
    geometryColumns: [geometryColumn]
  }).getChild(geometryColumn);
  if (!outputVector) {
    throw new Error(`Spatial join could not encode geometry column "${geometryColumn}" as WKB.`);
  }
  const metadata = new Map(field.metadata || []);
  metadata.set('ARROW:extension:name', 'geoarrow.wkb');
  const extensionMetadataKey = 'ARROW:extension:metadata';
  const extensionMetadata = metadata.get(extensionMetadataKey);
  if (extensionMetadata) {
    try {
      const parsedMetadata = JSON.parse(extensionMetadata) as Record<string, unknown>;
      parsedMetadata.encoding = 'geoarrow.wkb';
      metadata.set(extensionMetadataKey, JSON.stringify(parsedMetadata));
    } catch {
      metadata.delete(extensionMetadataKey);
    }
  }
  return {vector: outputVector, metadata};
}

/** Expands a row envelope for a distance-aware candidate search. */
function expandBounds(
  bounds: readonly [number, number, number, number],
  distance: number
): readonly [number, number, number, number] {
  return [bounds[0] - distance, bounds[1] - distance, bounds[2] + distance, bounds[3] + distance];
}

type SpatialBounds = readonly [number, number, number, number];
type SpatialBoundsIndexEntry = Readonly<{
  rowIndex: number;
  west: number;
  east: number;
  south: number;
  north: number;
}>;

/** Sorted interval index over right-hand GeoArrow row bounds. */
class SpatialBoundsIndex {
  private readonly entries: readonly SpatialBoundsIndexEntry[];

  /** Builds a longitude interval index from nullable row bounds. */
  constructor(rowBounds: readonly (SpatialBounds | null)[]) {
    const entries: SpatialBoundsIndexEntry[] = [];
    rowBounds.forEach((bounds, rowIndex) => {
      if (!bounds) return;
      for (const [west, east] of getLongitudeIntervals(bounds[0], bounds[2])) {
        entries.push({rowIndex, west, east, south: bounds[1], north: bounds[3]});
      }
    });
    entries.sort((left, right) => left.west - right.west || left.east - right.east);
    this.entries = entries;
  }

  /** Returns right-hand rows whose indexed intervals conservatively intersect a query envelope. */
  query(queryBounds: SpatialBounds): readonly number[] {
    const rows = new Set<number>();
    for (const [west, east] of getLongitudeIntervals(queryBounds[0], queryBounds[2])) {
      const endIndex = this.findFirstWestAfter(east);
      for (let entryIndex = 0; entryIndex < endIndex; entryIndex++) {
        const entry = this.entries[entryIndex];
        if (entry.east >= west && entry.south <= queryBounds[3] && entry.north >= queryBounds[1]) {
          rows.add(entry.rowIndex);
        }
      }
    }
    return [...rows];
  }

  /** Finds the exclusive upper bound for intervals starting at or before a longitude. */
  private findFirstWestAfter(longitude: number): number {
    let low = 0;
    let high = this.entries.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (this.entries[middle].west <= longitude) low = middle + 1;
      else high = middle;
    }
    return low;
  }
}
