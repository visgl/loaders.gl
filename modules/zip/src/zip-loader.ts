// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {ZipLoader} from './zip-loader-types';
import type {ZipFileMap, ZipLoaderOptions} from './zip-loader-types';
import type {ZipArchiveInput, ZipEntry} from './zip-archive-types';
import {openZipArchive} from './zip-archive';

const {preload: _preload, ...metadata} = ZipLoader;

/** Parser-bearing ZIP loader, available through @loaders.gl/zip/zip-loader. */
export const ZipLoaderWithParser = {
  ...metadata,
  parse: parseZip
} as const satisfies LoaderWithParser<ZipFileMap, never, ZipLoaderOptions>;

/** Validates retained output size before decoding files, and closes on every path. */
async function parseZip(
  input: ZipArchiveInput,
  options: ZipLoaderOptions = {}
): Promise<ZipFileMap> {
  const maximum = options.zip?.maxTotalDecodedBytes ?? ZipLoader.options.zip.maxTotalDecodedBytes;
  if (typeof maximum !== 'bigint' || maximum < 0n)
    throw new RangeError('Invalid ZIP total decoded-byte limit');
  const archive = await openZipArchive(input, options.zip);
  try {
    const entries: ZipEntry[] = [];
    let totalBytes = 0n;
    for await (const entry of archive.entries()) {
      if (entry.directory) continue;
      totalBytes += entry.size;
      if (totalBytes > maximum) throw new RangeError('ZIP total decoded-byte limit exceeded');
      entries.push(entry);
    }
    const files: ZipFileMap = Object.create(null);
    for (const entry of entries) files[entry.path] = await archive.read(entry);
    return files;
  } finally {
    await archive.close();
  }
}
