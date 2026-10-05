// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTileConversionFile} from '@loaders.gl/tile-converter/v5/core';

/** Output-size budget for a single-mesh 3TZ archive. */
export interface SingleMeshTilesetArchiveOptions {
  /** Maximum final archive bytes, including ZIP headers and index; not peak serialization memory. */
  readonly maxArchiveBytes: number;
}

/**
 * Packages the two unmodified files from a finalized single-mesh sink as a downloadable 3TZ Blob.
 * The writer checks the complete archive budget before reading either Blob. Applications own
 * object-URL creation/revocation and download UI. Retained input Blobs and transient ZIP buffers
 * are additional memory. SLPK requires separately authored I3S scene-layer resources.
 * @param files - Files returned by a successfully finalized createSingleMeshTilesetSink.
 * @param options - Required final archive-size budget.
 * @returns An indexed 3TZ Blob; save with the .3tz extension.
 */
export async function createSingleMeshTilesetArchive(
  files: readonly BrowserTileConversionFile[],
  options: SingleMeshTilesetArchiveOptions
): Promise<Blob> {
  const {maxArchiveBytes} = options;
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 0) {
    throw new TileConversionError(
      'INVALID_ARCHIVE_BYTE_LIMIT',
      'Archive byte limit must be a non-negative safe integer'
    );
  }
  if (
    files.length !== 2 ||
    !files.some(file => file.resourceId === 'mesh.glb') ||
    !files.some(file => file.resourceId === 'tileset.json')
  ) {
    throw new TileConversionError(
      'INVALID_SINGLE_MESH_ARCHIVE',
      'Expected mesh.glb and tileset.json from a finalized single-mesh sink'
    );
  }
  const resources = Object.fromEntries(files.map(file => [file.resourceId, file.blob]));
  const archive = await Tiles3DArchiveWriter.encode(resources, {'3tz': {maxArchiveBytes}});
  return new Blob([archive], {type: Tiles3DArchiveWriter.mimeTypes[0]});
}
