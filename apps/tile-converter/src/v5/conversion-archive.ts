// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Tiles3DArchiveWriter,
  encodeTiles3DArchiveInBatches
} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';
import {SLPKWriter, encodeSLPKArchiveInBatches} from '@loaders.gl/i3s/i3s-slpk-writer';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTileConversionFile} from '@loaders.gl/tile-converter/v5/core';

/** Output profile and required budget for packaging finalized conversion resources. */
export interface TileConversionArchiveOptions {
  /** Archive format; resources must already use the selected format's layout and encoding. */
  readonly format: '3tz' | 'slpk';
  /** Maximum final archive bytes, including headers/index; not peak serialization memory. */
  readonly maxArchiveBytes: number;
  /** Cooperative packaging cancellation; active Blob reads and entry encodes finish first. */
  readonly signal?: AbortSignal;
}

/**
 * Packages finalized, already-authored resources as a bounded 3TZ or SLPK Blob.
 * 3TZ requires tileset.json; SLPK requires 3dSceneLayer.json.gz and precompressed I3S resources.
 * Selecting an archive format does not convert geometry, metadata, or coordinate systems.
 * Applications own input qualification, object URLs, and downloads. Inputs must remain unchanged.
 * @param files - Unmodified files from a successfully finalized browser sink.
 * @param options - Archive format and complete output-size budget.
 * @returns Archive Blob to save using the selected .3tz or .slpk extension.
 */
export async function createTileConversionArchive(
  files: readonly BrowserTileConversionFile[],
  options: TileConversionArchiveOptions
): Promise<Blob> {
  const {resources, format, maxArchiveBytes, signal} = prepareArchiveInput(files, options);
  const writer = format === '3tz' ? Tiles3DArchiveWriter : SLPKWriter;
  const archive = await writer.encode(resources, {[format]: {maxArchiveBytes, signal}});
  return new Blob([archive], {type: writer.mimeTypes[0]});
}

/**
 * Streams finalized resources as a bounded 3TZ or SLPK archive without a complete output buffer.
 * Checks declarations and the full budget on first pull, before output. Await each chunk write
 * for backpressure; callers finalize storage only after successful completion and discard partial
 * output on failure, cancellation, or early exit. Resource inputs remain caller-owned and immutable.
 * Retains the current entry plus index/directory metadata; this is not a total heap guarantee.
 * @param files - Files from a successfully finalized browser conversion sink.
 * @param options - Format, complete archive-size budget, and optional cancellation signal.
 * @returns Uint8Array views to write to application-owned storage, respecting their byte ranges.
 */
export async function* encodeTileConversionArchiveInBatches(
  files: readonly BrowserTileConversionFile[],
  options: TileConversionArchiveOptions
): AsyncIterable<Uint8Array<ArrayBuffer>> {
  const {resources, format, maxArchiveBytes, signal} = prepareArchiveInput(files, options);
  const encode = format === '3tz' ? encodeTiles3DArchiveInBatches : encodeSLPKArchiveInBatches;
  yield* encode(resources, {[format]: {maxArchiveBytes, signal}});
}

/** Captures archive resources/options and preserves the converter's typed input diagnostics. */
function prepareArchiveInput(
  files: readonly BrowserTileConversionFile[],
  options: TileConversionArchiveOptions
) {
  const {format, maxArchiveBytes, signal} = options;
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 0) {
    throw new TileConversionError(
      'INVALID_ARCHIVE_BYTE_LIMIT',
      'Archive byte limit must be a non-negative safe integer'
    );
  }
  if (format !== '3tz' && format !== 'slpk') {
    throw new TileConversionError('INVALID_ARCHIVE_FORMAT', 'Expected 3tz or slpk archive format');
  }
  const resources = Object.fromEntries(files.map(file => [file.resourceId, file.blob]));
  if (Object.keys(resources).length !== files.length) {
    throw new TileConversionError(
      'DUPLICATE_ARCHIVE_RESOURCE',
      'Archive resource identifiers must be unique'
    );
  }
  return {resources, format, maxArchiveBytes, signal};
}
