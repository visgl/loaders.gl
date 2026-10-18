// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ZipArchiveOptions} from '@loaders.gl/zip';
import {SLPKArchive} from './slpk-archieve';

/** Opens the indexed archive through the shared ZIP transport, retaining format path policy. */
export async function parseSLPKArchive(
  fileProvider: ReadableFile,
  callback?: (message: string) => void,
  fileName?: string,
  options?: ZipArchiveOptions
): Promise<SLPKArchive> {
  const archive = new SLPKArchive(fileProvider, undefined, fileName, options);
  try {
    if (!(await archive.initializeIndex('@specialIndexFileHASH128@', true)))
      callback?.(
        'SLPK doesnt contain hash file, hash info has been composed according to zip archive headers'
      );
    return archive;
  } catch (error) {
    await archive.close();
    throw error;
  }
}
