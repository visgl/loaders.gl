// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {encodeIndexedZip, encodeIndexedZipInBatches} from '@loaders.gl/zip/indexed-zip-writer';
import type {IndexedZipOptions} from '@loaders.gl/zip/indexed-zip-writer';
import {ThreeTZFormat} from './tiles-3d-format';
import {VERSION} from './lib/utils/version';

/** Portable resources with canonical relative ASCII paths; JSON and content must already be valid. */
export type Tiles3DArchiveFiles = Readonly<Record<string, ArrayBuffer | Blob>>;

/** Options for the bounded, uncompressed ZIP32 3TZ writer. */
export type Tiles3DArchiveWriterOptions = WriterOptions & {
  /** 3TZ packaging options. */
  '3tz'?: {
    /** Maximum archive bytes, including ZIP headers and the index; not a peak-memory limit. */
    maxArchiveBytes?: number;
    /** Cooperative cancellation between payload block reads and header encodes. */
    signal?: AbortSignal;
  };
};

/** Largest supported archive, below the ZIP64 sentinel. */
const MAX_ARCHIVE_BYTES = 0xfffffffe;
/** Required final uncompressed index entry. */
const INDEX_PATH = '@3dtilesIndex1@';

/**
 * Packages already-authored 3D Tiles resources as a deterministic indexed 3TZ archive.
 * Uses STORE, populated local headers, a fixed timestamp, and a final case-sensitive MD5 index.
 * Requires root tileset.json and canonical relative ASCII file paths; does not validate content
 * or external references. ZIP64, compression, streaming, and scene authoring are separate APIs.
 */
export const Tiles3DArchiveWriter = {
  ...ThreeTZFormat,
  version: VERSION,
  mimeTypes: ['application/vnd.maxar.archive.3tz+zip'],
  options: {'3tz': {maxArchiveBytes: MAX_ARCHIVE_BYTES}},
  encode: encodeArchive
} as const satisfies WriterWithEncoder<Tiles3DArchiveFiles, never, Tiles3DArchiveWriterOptions>;

/** Checks the 3TZ resource layout before delegating to the shared indexed ZIP encoder. */
async function encodeArchive(
  files: Tiles3DArchiveFiles,
  options: Tiles3DArchiveWriterOptions = {}
): Promise<ArrayBuffer> {
  return await encodeIndexedZip(files, getArchiveOptions(files, options));
}

/**
 * Streams the same deterministic archive bytes without allocating the complete output buffer.
 * Payload reads/copies are at most 64 KiB, with a checksum pass before each populated header.
 * Validation occurs on first pull. Callers await each chunk write, finalize only on completion,
 * and discard partial output on failure or cancellation. Chunks are Uint8Array views.
 * @param files - Immutable resources already authored for this archive format.
 * @param options - Complete output-size budget and cooperative cancellation signal.
 * @returns Byte chunks suitable for an application-owned output stream.
 */
export async function* encodeTiles3DArchiveInBatches(
  files: Tiles3DArchiveFiles,
  options: Tiles3DArchiveWriterOptions = {}
): AsyncIterable<Uint8Array<ArrayBuffer>> {
  yield* encodeIndexedZipInBatches(files, getArchiveOptions(files, options));
}

/** Validates the format root/layout and captures the shared indexed ZIP profile. */
function getArchiveOptions(
  files: Tiles3DArchiveFiles,
  options: Tiles3DArchiveWriterOptions
): IndexedZipOptions {
  const paths = Object.keys(files);
  if (!paths.includes('tileset.json')) {
    throw new RangeError('3TZ requires tileset.json');
  }
  if (paths.some(path => /\.3tz|\.3dtiles\.zip/i.test(path))) {
    throw new TypeError(
      '3TZ requires canonical relative ASCII resource paths without nested archives'
    );
  }
  return {
    indexPath: INDEX_PATH,
    maxArchiveBytes: options['3tz']?.maxArchiveBytes ?? MAX_ARCHIVE_BYTES,
    signal: options['3tz']?.signal
  };
}
