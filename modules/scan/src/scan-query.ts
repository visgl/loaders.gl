// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Source-neutral values emitted by a scan query editor.
 *
 * This type is deliberately smaller than any one format's executor options. Applications can
 * pass it between metadata-driven controls and adapters, which may normalize or ignore values
 * that are not supported by a particular source family.
 */
export type ScanQuery = Readonly<{
  /** Output columns; an empty selection means all columns. */
  columns?: readonly string[];
  /** Maximum number of rows, features, or points to return. */
  limit?: number;
  /** Optional source-coordinate bounding box in minX, minY, maxX, maxY order. */
  boundingBox?: readonly [number, number, number, number];
  /** Optional raster overview or point-cloud hierarchy level. */
  level?: number;
  /** Optional point-cloud minimum hierarchy level. */
  minimumLevel?: number;
  /** Optional point-cloud maximum hierarchy level. */
  maximumLevel?: number;
  /** Optional point-cloud target spacing. */
  targetSpacing?: number;
}>;
