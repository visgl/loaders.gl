// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ColumnarPredicate} from './columnar-predicate';
import type {ScanBounds, ScanExecutionTelemetryCallback} from './scan-query-metadata';

/**
 * Experimental common scan request accepted by loaders that implement the scan protocol.
 *
 * Format loaders apply the fields relevant to their query family and must reject unsupported
 * fields rather than silently ignoring them. This intentionally remains a common superset in 5.0
 * so applications and Deck.gl adapters can forward one stable option object.
 */
export type ExperimentalScanOptions = Readonly<{
  /** Portable predicate for table-like sources. */
  predicate?: ColumnarPredicate;
  /** Output columns or bands selected by the caller. */
  columns?: readonly string[];
  /** Maximum number of rows or points retained after filtering. */
  limit?: number;
  /** Cooperative cancellation signal. */
  signal?: AbortSignal;
  /** Receives one terminal execution snapshot without changing query semantics. */
  onTelemetry?: ScanExecutionTelemetryCallback;
  /** Source-coordinate bounds for spatial, raster, and point-cloud scans. */
  bounds?: ScanBounds;
  /** Raster overview or point-cloud hierarchy level. */
  level?: number;
  /** Shallowest point-cloud hierarchy level to read. */
  minimumLevel?: number;
  /** Deepest point-cloud hierarchy level to read. */
  maximumLevel?: number;
  /** Desired maximum point spacing for point-cloud scans. */
  targetSpacing?: number;
  /** Requested raster output width in pixels. */
  width?: number;
  /** Requested raster output height in pixels. */
  height?: number;
  /** Named raster variables or bands. */
  variables?: readonly string[];
  /** Numeric raster channel indices. */
  channels?: readonly number[];
  /** Raster dimension indices or half-open ranges. */
  slices?: Readonly<Record<string, number | readonly [number, number]>>;
}>;
