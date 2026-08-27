// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ColumnarPredicate, ColumnarPredicateProperty} from './columnar-predicate';
import type {
  TableQueryCapabilities,
  TableQueryOperatorSupport,
  TableQueryOptions
} from './table-query';
import {validateTableQueryOptions} from './table-query';

/** Three-dimensional axis-aligned bounds in the point cloud's source coordinate system. */
export type PointCloudQueryBounds = Readonly<{
  /** Inclusive minimum X, Y, and Z coordinates. */
  minimum: readonly [x: number, y: number, z: number];
  /** Inclusive maximum X, Y, and Z coordinates. */
  maximum: readonly [x: number, y: number, z: number];
}>;

/** Portable attribute, bounds, and hierarchy request for a point-cloud scan. */
export type PointCloudQueryOptions<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate
> = TableQueryOptions<PredicateT> &
  Readonly<{
    /** Optional three-dimensional source-coordinate bounds. */
    bounds?: PointCloudQueryBounds;
    /** Shallowest hierarchy level that may contribute points. */
    minimumLevel?: number;
    /** Deepest hierarchy level that may contribute points. */
    maximumLevel?: number;
    /** Desired maximum point spacing in source coordinate units. */
    targetSpacing?: number;
  }>;

/** Capabilities advertised by a point-cloud query adapter. */
export type PointCloudQueryCapabilities = TableQueryCapabilities &
  Readonly<{
    /** Whether spatial bounds prune hierarchy nodes or are evaluated residually. */
    bounds: TableQueryOperatorSupport;
    /** Whether hierarchy level constraints avoid physical node reads. */
    levelOfDetail: TableQueryOperatorSupport;
    /** Whether target spacing participates in physical node selection. */
    spacing: TableQueryOperatorSupport;
  }>;

/** One hierarchy node considered by a portable point-cloud scan planner. */
export type PointCloudScanTile = Readonly<{
  /** Stable source-defined node identifier. */
  id: string;
  /** Zero-based hierarchy level. */
  level: number;
  /** Number of points stored by this node. */
  pointCount: number;
  /** Source spacing or geometric error represented by this node. */
  geometricError: number;
  /** Three-dimensional node bounds in the source coordinate system. */
  bounds: PointCloudQueryBounds;
}>;

/** Loads the direct children of one portable point-cloud scan tile. */
export type PointCloudScanChildrenLoader<TileT extends PointCloudScanTile = PointCloudScanTile> = (
  tile: TileT
) => Promise<readonly TileT[]>;

/** Validates a point-cloud query against the attributes exposed by one source. */
export function validatePointCloudQueryOptions<
  ValueT,
  PropertyT extends ColumnarPredicateProperty,
  PredicateT extends ColumnarPredicate<ValueT, PropertyT>
>(sourceColumnNames: readonly string[], options: PointCloudQueryOptions<PredicateT>): void {
  validateTableQueryOptions(sourceColumnNames, options);
  validatePointCloudBounds(options.bounds);
  validateHierarchyLevel(options.minimumLevel, 'minimumLevel');
  validateHierarchyLevel(options.maximumLevel, 'maximumLevel');
  if (
    options.minimumLevel !== undefined &&
    options.maximumLevel !== undefined &&
    options.minimumLevel > options.maximumLevel
  ) {
    throw new Error('Point cloud query minimumLevel cannot exceed maximumLevel.');
  }
  if (
    options.targetSpacing !== undefined &&
    (!Number.isFinite(options.targetSpacing) || options.targetSpacing <= 0)
  ) {
    throw new Error('Point cloud query targetSpacing must be a positive finite number.');
  }
}

/**
 * Selects point-cloud hierarchy nodes in deterministic breadth-first order.
 *
 * Bounds reject whole subtrees. Maximum level and target spacing stop descent after the selected
 * node, while minimum level suppresses coarser node payloads without suppressing their children.
 */
export async function* selectPointCloudScanTiles<TileT extends PointCloudScanTile>(
  rootTile: TileT,
  loadChildren: PointCloudScanChildrenLoader<TileT>,
  options: PointCloudQueryOptions = {}
): AsyncIterableIterator<TileT> {
  const pendingTiles: TileT[] = [rootTile];
  const minimumLevel = options.minimumLevel ?? 0;

  while (pendingTiles.length > 0) {
    throwIfPointCloudScanAborted(options.signal);
    const tile = pendingTiles.shift()!;
    if (options.bounds && !intersectPointCloudBounds(tile.bounds, options.bounds)) {
      continue;
    }

    const satisfiesMinimumLevel = tile.level >= minimumLevel;
    if (satisfiesMinimumLevel) {
      yield tile;
    }

    const reachedMaximumLevel =
      options.maximumLevel !== undefined && tile.level >= options.maximumLevel;
    const reachedTargetSpacing =
      satisfiesMinimumLevel &&
      options.targetSpacing !== undefined &&
      tile.geometricError <= options.targetSpacing;
    if (reachedMaximumLevel || reachedTargetSpacing) {
      continue;
    }

    const children = [...(await loadChildren(tile))].sort((left, right) =>
      left.id.localeCompare(right.id)
    );
    pendingTiles.push(...children);
  }
}

/** Returns whether two inclusive point-cloud bounds intersect. */
export function intersectPointCloudBounds(
  left: PointCloudQueryBounds,
  right: PointCloudQueryBounds
): boolean {
  for (let dimension = 0; dimension < 3; dimension++) {
    if (
      left.maximum[dimension] < right.minimum[dimension] ||
      left.minimum[dimension] > right.maximum[dimension]
    ) {
      return false;
    }
  }
  return true;
}

function validatePointCloudBounds(bounds: PointCloudQueryBounds | undefined): void {
  if (!bounds) {
    return;
  }
  for (let dimension = 0; dimension < 3; dimension++) {
    const minimum = bounds.minimum[dimension];
    const maximum = bounds.maximum[dimension];
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
      throw new Error('Point cloud query bounds must contain finite coordinates.');
    }
    if (minimum > maximum) {
      throw new Error('Point cloud query bounds minimum cannot exceed maximum.');
    }
  }
}

function validateHierarchyLevel(level: number | undefined, name: string): void {
  if (level !== undefined && (!Number.isSafeInteger(level) || level < 0)) {
    throw new Error(`Point cloud query ${name} must be a non-negative safe integer.`);
  }
}

function throwIfPointCloudScanAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }
}
