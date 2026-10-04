// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';
import {SLPKWriter} from '@loaders.gl/i3s/i3s-slpk-writer';
import {TileConversionError} from './conversion-api.js';
import type {BrowserTileConversionFile} from './browser-sink.js';

/** Output profile and required budget for packaging finalized conversion resources. */
export interface TileConversionArchiveOptions {
  /** Archive format; resources must already use the selected format's layout and encoding. */
  readonly format: '3tz' | 'slpk';
  /** Maximum final archive bytes, including headers/index; not peak serialization memory. */
  readonly maxArchiveBytes: number;
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
  const {format, maxArchiveBytes} = options;
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
  const writer = format === '3tz' ? Tiles3DArchiveWriter : SLPKWriter;
  const archive = await writer.encode(resources, {[format]: {maxArchiveBytes}});
  return new Blob([archive], {type: writer.mimeTypes[0]});
}
