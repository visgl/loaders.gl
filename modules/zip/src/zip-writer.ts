// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {ZipFormat} from './zip-format';
import {encodeZip} from './zip-encode';
import type {
  ZipEncodeFiles,
  ZipEncodeOptions,
  ZipByteSource,
  ZipEncodeEntry
} from './zip-encode-types';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Named binary sources or UTF-8 strings accepted by the buffered writer. */
export type ZipWriterFiles = Readonly<Record<string, string | ZipByteSource | ZipEncodeEntry>>;

/** Native encoding controls and optional directory/completion notifications. */
export type ZipWriterOptions = WriterOptions & {
  /** Native ZIP options; no third-party passthrough is supported. */
  zip?: ZipEncodeOptions & {
    /** Reports 0 before encoding and 100 after successful completion. */
    readonly onUpdate?: (metadata: {percent: number}) => void;
    /** Emits parent directory entries for nested file keys; default false. */
    readonly createFolders?: boolean;
  };
};

/** Buffered native ZIP32/ZIP64 writer with STORE as the default compression. */
export const ZipWriter = {
  ...ZipFormat,
  version: VERSION,
  options: {zip: {createFolders: false}},
  encode: encodeZipFiles
} as const satisfies WriterWithEncoder<ZipWriterFiles, never, ZipWriterOptions>;

/** Converts string values and directory options before delegating to the native encoder. */
async function encodeZipFiles(
  input: ZipWriterFiles,
  options: ZipWriterOptions = {}
): Promise<ArrayBuffer> {
  options.zip?.signal?.throwIfAborted();
  if ('jszip' in options) throw new TypeError('jszip options were removed; use typed zip options');
  const files: Record<string, ZipEncodeFiles[string]> = Object.create(null);
  const maximum = options.zip?.maxEntries ?? 100000;
  if (!Number.isSafeInteger(maximum) || maximum < 1)
    throw new RangeError('Invalid ZIP entry limit');
  let count = 0;
  /** Adds a unique resource without exceeding the native entry budget during folder expansion. */
  const addFile = (path: string, data: ZipEncodeFiles[string]): void => {
    if (!Object.hasOwn(files, path) && ++count > maximum)
      throw new RangeError('ZIP entry limit exceeded');
    files[path] = data;
  };
  for (const [path, data] of Object.entries(input)) {
    if (path.endsWith('/') || options.zip?.createFolders) {
      let offset = path.indexOf('/');
      while (offset !== -1) {
        const directory = path.slice(0, offset + 1);
        if (!Object.hasOwn(input, directory)) addFile(directory, new Uint8Array(0));
        offset = path.indexOf('/', offset + 1);
      }
    }
    addFile(path, typeof data === 'string' ? new TextEncoder().encode(data) : data);
  }
  options.zip?.onUpdate?.({percent: 0});
  const bytes = await encodeZip(files, options.zip);
  options.zip?.onUpdate?.({percent: 100});
  return bytes;
}
