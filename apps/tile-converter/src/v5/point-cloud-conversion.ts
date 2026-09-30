// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PointCloudTilesetSource} from '@loaders.gl/tiles';
import {convertTileset} from './conversion-api.js';
import type {
  TileConversionProgress,
  TileConversionReport,
  TileConversionSink
} from './conversion-api.js';
import {traversePointCloudSource} from './point-cloud-source.js';
import type {PointCloudSourceTile} from './point-cloud-source.js';
import {encodePointCloudSourceTile} from './point-cloud-source-encoder.js';
import type {
  EncodedPointCloudSourceTile,
  EncodePointCloudSourceOptions
} from './point-cloud-source-encoder.js';

/** Point-cloud encoding options and an application-owned output destination. */
export interface ConvertPointCloudSourceOptions extends EncodePointCloudSourceOptions {
  /** Destination receiving PNTS resources and their source placement metadata. */
  readonly sink: TileConversionSink<EncodedPointCloudSourceTile>;
  /** Input byte accounting for each visited source tile, including tiles with null content. */
  readonly measureInputBytes: (sourceTile: PointCloudSourceTile) => number;
  /** Maximum bytes in one encoded PNTS resource. Defaults to no limit. */
  readonly maxOutputResourceBytes?: number;
  /** Receive conversion progress, including resource counts and caller-measured input bytes. */
  readonly onProgress?: (progress: TileConversionProgress) => void;
}

/**
 * Converts a point-cloud source to PNTS resources through the v5 output-sink lifecycle.
 *
 * Each write is awaited before reading the next source tile. The destination is finalized only
 * after traversal and writes succeed, and aborted on read, encoding, write, or cancellation errors.
 * Input resource counts include empty tiles; output counts and byte sizes describe emitted PNTS
 * resources. Applications supply input byte accounting because source tiles contain decoded Arrow
 * data rather than transport bytes. The caller retains ownership of the input source.
 *
 * @param source - An I3S, COPC, or compatible point-cloud source to initialize and traverse.
 * @param options - Destination, byte accounting, traversal limits, and per-tile encoding options.
 * @returns The shared v5 conversion report after destination finalization.
 */
export function convertPointCloudSource(
  source: PointCloudTilesetSource,
  options: ConvertPointCloudSourceOptions
): Promise<TileConversionReport> {
  return convertTileset({
    source: {
      async inspect() {
        if (!source.isReady) {
          await source.initialize();
        }
      },
      read: (_inspection, signal) =>
        traversePointCloudSource(source, {maxDepth: options.maxDepth, signal})
    },
    codec: {
      async *convert(sourceTile) {
        const encodingOptions = sourceTile.content
          ? options.getTileEncodingOptions?.(sourceTile)
          : undefined;
        const encodedTile = encodePointCloudSourceTile(sourceTile, encodingOptions);
        if (encodedTile) {
          yield encodedTile;
        }
      }
    },
    sink: options.sink,
    measureInputBytes: options.measureInputBytes,
    measureOutputBytes: resource => resource.pnts.byteLength,
    maxOutputResourceBytes: options.maxOutputResourceBytes,
    signal: options.signal,
    onProgress: options.onProgress
  });
}
