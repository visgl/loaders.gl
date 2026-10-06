// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {encodeIndexedZip} from '@loaders.gl/zip/indexed-zip-writer';
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
    /** Cooperative cancellation between resource reads and entry encodes. */
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
  const maxArchiveBytes = options.slpk?.maxArchiveBytes ?? MAX_ARCHIVE_BYTES;
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 0) {
    throw new RangeError('SLPK archive byte limit must be a non-negative safe integer');
  }
  if (!Object.keys(files).includes('3dSceneLayer.json.gz')) {
    throw new TypeError('SLPK requires root 3dSceneLayer.json.gz');
  }
  return await encodeIndexedZip(files, {
    indexPath: '@specialIndexFileHASH128@',
    maxArchiveBytes: Math.min(maxArchiveBytes, MAX_ARCHIVE_BYTES),
    lowercasePaths: true,
    signal: options.slpk?.signal
  });
}
