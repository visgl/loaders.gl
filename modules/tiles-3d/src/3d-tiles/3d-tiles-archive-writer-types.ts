// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ThreeTZFormat} from './tiles-3d-format';
import {VERSION} from './lib/utils/version';
import type {Tiles3DArchiveFiles, Tiles3DArchiveWriterOptions} from './3d-tiles-archive-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Largest supported archive, below the ZIP64 sentinel. */
export const MAX_ARCHIVE_BYTES = 0xfffffffe;

/** Shared Tiles3DArchiveWriter metadata and defaults. */
export const TILES_3D_ARCHIVE_WRITER_METADATA = {
  ...ThreeTZFormat,
  version: VERSION,
  mimeTypes: ['application/vnd.maxar.archive.3tz+zip'],
  options: {'3tz': {maxArchiveBytes: MAX_ARCHIVE_BYTES}}
} as const satisfies Writer<Tiles3DArchiveFiles, never, Tiles3DArchiveWriterOptions>;

/** Metadata for encoding with Tiles3DArchiveWriter through the core APIs. */
export const Tiles3DArchiveWriter = {
  ...TILES_3D_ARCHIVE_WRITER_METADATA,
  dataType: null as unknown as Tiles3DArchiveFiles,
  batchType: null as never,
  options: TILES_3D_ARCHIVE_WRITER_METADATA.options as Tiles3DArchiveWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {Tiles3DArchiveWriter} = await import('./3d-tiles-archive-writer.js');
    return Tiles3DArchiveWriter;
  }
} as const satisfies Writer<Tiles3DArchiveFiles, never, Tiles3DArchiveWriterOptions>;
