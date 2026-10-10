// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import type {PointCloudTilerOptions} from '@loaders.gl/schema-utils';
import type {TilesetSpatialReference} from '@loaders.gl/tiles';
import {PointCloudTileSource} from '@loaders.gl/tiles/point-cloud-tile-source';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTileConversionFile,
  TileConversionProgress,
  TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';
import {convertPointCloudSource} from './point-cloud-conversion.js';
import {createPointCloudTilesetSink} from './point-cloud-tileset-sink.js';
import type {PointCloudTilesetSinkOptions} from './point-cloud-tileset-sink.js';
import {createTileConversionArchive} from './conversion-archive.js';
import type {TileConversionArchiveOptions} from './conversion-archive.js';

/** Bounded authoring of a complete decoded ECEF point dataset. */
export interface ConvertPointCloudToTilesetOptions extends PointCloudTilesetSinkOptions {
  /** Explicit native EPSG:4978 XYZ meters with ellipsoidal heights. No CRS is inferred. */
  readonly spatialReference: TilesetSpatialReference;
  /** In-memory input, index, gathered-tile and node limits; defaults belong to PointCloudTiler. */
  readonly tiling?: Omit<PointCloudTilerOptions, 'signal'>;
  /** Also create an indexed 3TZ Blob within this final archive-size budget. */
  readonly archive?: Pick<TileConversionArchiveOptions, 'maxArchiveBytes'>;
  /** Cooperative cancellation during indexing, traversal, encoding and packaging. */
  readonly signal?: AbortSignal;
  /** PNTS conversion progress; excludes tileset JSON and optional archive packaging. */
  readonly onProgress?: (progress: TileConversionProgress) => void;
}

/** Completed point authoring result; no partial files are returned on failure. */
export interface ConvertedPointCloudTileset {
  /** Exact number of input points, each emitted once across the complete collection. */
  readonly pointCount: number;
  /** PNTS resource counts and bytes; input bytes count gathered Arrow column buffers. */
  readonly report: TileConversionReport;
  /** PNTS resources and tileset.json, including JSON in the retained output byte budget. */
  readonly files: readonly BrowserTileConversionFile[];
  /** Optional indexed 3TZ Blob. Applications own saving and object URL lifetimes. */
  readonly archive?: Blob;
}

/**
 * Tiles decoded point Mesh/Arrow data and authors a flat additive 3D Tiles 1.0 collection.
 * All input rows are emitted once, including remaining rows at the tiler's maximum depth.
 * Per-tile RTC centers reduce float32 rounding; geometricError gates measured reconstruction error.
 * The flat collection does not preserve octree LOD or provide a sampling-error guarantee.
 * Input must remain immutable until completion. Arrow normalization can copy buffers; retained
 * input, row indexes, gathered tiles, output Blobs and optional ZIP temporaries are separate memory.
 * This is bounded in-memory authoring, not streaming ingestion or an out-of-core converter.
 * Unsupported PNTS attributes fail; callers must explicitly map or remove them beforehand.
 * @param input - One decoded unindexed point-list with finite floating-point XYZ positions.
 * @param options - Explicit ECEF frame, precision and resource limits, and optional 3TZ packaging.
 * @returns Completed files and report after releasing the privately owned dynamic source.
 */
export async function convertPointCloudToTileset(
  input: Mesh | MeshArrowTable,
  options: ConvertPointCloudToTilesetOptions
): Promise<ConvertedPointCloudTileset> {
  const reference = options.spatialReference;
  if (
    !reference ||
    reference.status !== 'native' ||
    reference.sourceCrs !== 'EPSG:4978' ||
    (reference.targetCrs && reference.targetCrs !== 'EPSG:4978') ||
    reference.coordinateFrame !== 'geocentric' ||
    reference.axisOrder !== 'xyz' ||
    reference.heightReference !== 'ellipsoidal' ||
    reference.verticalUnitScale !== 1 ||
    reference.units?.some(unit => unit !== 'meter')
  ) {
    throw new TileConversionError(
      'POINT_CLOUD_TILESET_FRAME_UNSUPPORTED',
      'Point authoring requires explicit native EPSG:4978 xyz meters and ellipsoidal heights'
    );
  }
  if (
    options.archive &&
    (!Number.isSafeInteger(options.archive.maxArchiveBytes) || options.archive.maxArchiveBytes < 0)
  ) {
    throw new TileConversionError(
      'INVALID_ARCHIVE_BYTE_LIMIT',
      'Archive byte limit must be a non-negative safe integer'
    );
  }
  options.signal?.throwIfAborted();
  const sink = createPointCloudTilesetSink(options);
  let source: PointCloudTileSource | undefined;
  try {
    source = new PointCloudTileSource(input, {
      pointCloudTiler: {...options.tiling, signal: options.signal, spatialReference: reference}
    });
    const {pointCount} = await source.getMetadata();
    const report = await convertPointCloudSource(source, {
      sink,
      signal: options.signal,
      onProgress: options.onProgress,
      measureInputBytes: tile => {
        const table = tile.content?.data.data;
        return table
          ? table.schema.fields.reduce(
              (bytes, _field, index) => bytes + (table.getChildAt(index)?.byteLength ?? 0),
              0
            )
          : 0;
      },
      getTileEncodingOptions: tile => ({
        rtcCenter: [
          tile.header.boundingVolume.center[0],
          tile.header.boundingVolume.center[1],
          tile.header.boundingVolume.center[2]
        ],
        maxPositionError: options.geometricError
      })
    });
    options.signal?.throwIfAborted();
    const files = sink.getFiles();
    const archive = options.archive
      ? await createTileConversionArchive(files, {
          format: '3tz',
          maxArchiveBytes: options.archive.maxArchiveBytes,
          signal: options.signal
        })
      : undefined;
    options.signal?.throwIfAborted();
    return {pointCount, report, files, archive};
  } catch (error) {
    await sink.abort(error);
    throw error;
  } finally {
    source?.close();
  }
}
