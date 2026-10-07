// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {encodeIndexedZip, encodeIndexedZipInBatches} from '@loaders.gl/zip/indexed-zip-writer';
import type {IndexedZipOptions} from '@loaders.gl/zip/indexed-zip-writer';
import type {IndexedZipFiles} from '@loaders.gl/zip/indexed-zip-writer';
import {SLPKFormat} from './i3s-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Encoded I3S layer resources, with archive paths and individual GZIP compression already applied. */
export type SLPKWriterFiles = IndexedZipFiles;

/** Options for the bounded SLPK ZIP32 profile. */
export type SLPKWriterOptions = WriterOptions & {
  /** SLPK packaging options. */
  slpk?: {
    /** Maximum final archive bytes, including headers/index; not peak serialization memory. */
    maxArchiveBytes?: number;
    /** Cooperative cancellation between payload block reads and header encodes. */
    signal?: AbortSignal;
  };
};

/** SLPK requires ZIP64 above 2 GiB; this initial writer only supports smaller ZIP32 archives. */
const MAX_ARCHIVE_BYTES = 0x7fffffff;

/**
 * Packages already-authored I3S resources in a portable, deterministic SLPK archive.
 * Requires root 3dSceneLayer.json.gz, canonical ASCII paths, and no case-folded duplicates.
 * Resources are stored unchanged; callers supply valid I3S metadata/geometry and GZIP resources.
 * Uses STORE and the required final lowercase MD5 index. ZIP64 and scene authoring are separate.
 */
export const SLPKWriter = {
  ...SLPKFormat,
  version: VERSION,
  options: {slpk: {maxArchiveBytes: MAX_ARCHIVE_BYTES}},
  encode: encodeArchive
} as const satisfies WriterWithEncoder<SLPKWriterFiles, never, SLPKWriterOptions>;

/** Checks the I3S layer root and format size ceiling before indexed ZIP encoding. */
async function encodeArchive(
  files: SLPKWriterFiles,
  options: SLPKWriterOptions = {}
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
export async function* encodeSLPKArchiveInBatches(
  files: SLPKWriterFiles,
  options: SLPKWriterOptions = {}
): AsyncIterable<Uint8Array<ArrayBuffer>> {
  yield* encodeIndexedZipInBatches(files, getArchiveOptions(files, options));
}

/** Validates the format root/layout and captures the shared indexed ZIP profile. */
function getArchiveOptions(files: SLPKWriterFiles, options: SLPKWriterOptions): IndexedZipOptions {
  const maxArchiveBytes = options.slpk?.maxArchiveBytes ?? MAX_ARCHIVE_BYTES;
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 0) {
    throw new RangeError('SLPK archive byte limit must be a non-negative safe integer');
  }
  if (!Object.keys(files).includes('3dSceneLayer.json.gz')) {
    throw new TypeError('SLPK requires root 3dSceneLayer.json.gz');
  }
  return {
    indexPath: '@specialIndexFileHASH128@',
    maxArchiveBytes: Math.min(maxArchiveBytes, MAX_ARCHIVE_BYTES),
    lowercasePaths: true,
    signal: options.slpk?.signal
  };
}
