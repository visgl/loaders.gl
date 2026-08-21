// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';
import type {
  ParquetDatasetFile,
  ParquetDatasetFileQuery,
  ParquetRowGroupMetadata,
  ParquetTelemetry
} from '@loaders.gl/parquet';

/** FSQ Places snapshot republished by Fused on Source Cooperative. */
export const FSQ_RELEASE = '2024-11-19';

/** Public browser-readable root of the Fused FSQ Places snapshot. */
export const FSQ_DATASET_URL =
  `https://data.source.coop/fused/fsq-os-places/${FSQ_RELEASE}/places/`;

/** Summary of the aggregate Parquet catalog. */
export type FsqPlacesCatalogSummary = {
  /** FSQ release date represented by the mirror. */
  release: string;
  /** Total rows declared by the aggregate metadata. */
  rowCount: number;
  /** Number of independently range-readable GeoParquet files. */
  fileCount: number;
  /** Number of row groups described by the aggregate metadata. */
  rowGroupCount: number;
  /** Transport telemetry for loading the aggregate metadata. */
  telemetry: ParquetTelemetry;
};

type FsqPlacesCatalog = {
  /** Dataset file descriptors derived from aggregate metadata. */
  files: readonly ParquetDatasetFile[];
  /** Aggregate catalog summary. */
  summary: FsqPlacesCatalogSummary;
};

type MutableFileDescriptor = {
  /** Relative child Parquet path. */
  path: string;
  /** Accumulated child extent. */
  bbox: [number, number, number, number];
  /** Rows represented by the child's row groups. */
  rowCount: number;
  /** Row groups represented by the child. */
  rowGroupCount: number;
};

/**
 * Adapts Fused's standard aggregate Parquet `_metadata` file to dataset file descriptors.
 *
 * The metadata is loaded once with range requests. Its row-group `file_path` values identify the
 * 81 child files, while longitude and latitude statistics provide conservative file extents.
 */
export class FsqPlacesCatalogProvider {
  /** Shared catalog initialization. */
  private catalogPromise: Promise<FsqPlacesCatalog> | null = null;

  /** Returns reusable file descriptors for `ParquetDatasetSource`. */
  async getFiles(_query: ParquetDatasetFileQuery): Promise<readonly ParquetDatasetFile[]> {
    return (await this.getCatalog()).files;
  }

  /** Returns release, scale, and metadata-transport information. */
  async getSummary(): Promise<FsqPlacesCatalogSummary> {
    return (await this.getCatalog()).summary;
  }

  /** Initializes and caches the aggregate catalog. */
  private getCatalog(): Promise<FsqPlacesCatalog> {
    this.catalogPromise ||= this.loadCatalog();
    return this.catalogPromise;
  }

  /** Reads aggregate metadata and groups row groups by their external child path. */
  private async loadCatalog(): Promise<FsqPlacesCatalog> {
    const source = new ParquetSource(`${FSQ_DATASET_URL}_metadata`, {
      core: {worker: false},
      rangeRequests: {batchDelayMs: 0, maxGapBytes: 32_768, rangeExpansionBytes: 0}
    });
    try {
      const metadata = await source.getMetadata();
      const filesByPath = new Map<string, MutableFileDescriptor>();
      for (const rowGroup of metadata.rowGroups) {
        const path = rowGroup.columns.find(column => column.filePath)?.filePath;
        if (!path) {
          continue;
        }
        const descriptor = filesByPath.get(path) || {
          path,
          bbox: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
          rowCount: 0,
          rowGroupCount: 0
        };
        extendBounds(descriptor.bbox, rowGroup);
        descriptor.rowCount += rowGroup.rowCount;
        descriptor.rowGroupCount++;
        filesByPath.set(path, descriptor);
      }
      const descriptors = [...filesByPath.values()].sort(
        (left, right) => Number.parseInt(left.path) - Number.parseInt(right.path)
      );
      const files = descriptors.map(
        (descriptor): ParquetDatasetFile => ({
          id: descriptor.path,
          data: new URL(descriptor.path, FSQ_DATASET_URL).toString(),
          bbox: descriptor.bbox,
          partitions: {release: FSQ_RELEASE},
          metadata: {
            rowCount: descriptor.rowCount,
            rowGroupCount: descriptor.rowGroupCount,
            publisher: 'Fused / Source Cooperative'
          }
        })
      );
      return {
        files,
        summary: {
          release: FSQ_RELEASE,
          rowCount: metadata.rowCount,
          fileCount: files.length,
          rowGroupCount: metadata.rowGroupCount,
          telemetry: source.getTelemetry()
        }
      };
    } finally {
      await source.close();
    }
  }
}

/** Extends a child file's extent with one row group's coordinate statistics. */
function extendBounds(
  bbox: [number, number, number, number],
  rowGroup: ParquetRowGroupMetadata
): void {
  const longitude = getColumnBounds(rowGroup, 'longitude');
  const latitude = getColumnBounds(rowGroup, 'latitude');
  if (longitude) {
    bbox[0] = Math.min(bbox[0], longitude[0]);
    bbox[2] = Math.max(bbox[2], longitude[1]);
  }
  if (latitude) {
    bbox[1] = Math.min(bbox[1], latitude[0]);
    bbox[3] = Math.max(bbox[3], latitude[1]);
  }
}

/** Reads finite numeric bounds for one top-level column. */
function getColumnBounds(
  rowGroup: ParquetRowGroupMetadata,
  columnName: string
): [number, number] | null {
  const statistics = rowGroup.columns.find(column => column.path[0] === columnName)?.statistics;
  return typeof statistics?.min === 'number' &&
    Number.isFinite(statistics.min) &&
    typeof statistics.max === 'number' &&
    Number.isFinite(statistics.max)
    ? [statistics.min, statistics.max]
    : null;
}
