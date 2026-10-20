// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/core/loader-utils';
import type {ZipArchiveOptions} from '@loaders.gl/zip';
import {Tiles3DArchive} from './3d-tiles-archive-archive';

/** Opens the indexed archive through the shared ZIP transport, retaining format path policy. */
export async function parse3DTilesArchive(
  fileProvider: ReadableFile,
  callback?: (message: string) => void,
  fileName?: string,
  options?: ZipArchiveOptions
): Promise<Tiles3DArchive> {
  const archive = new Tiles3DArchive(fileProvider, undefined, fileName, options);
  try {
    if (!(await archive.initializeIndex('@3dtilesIndex1@', false)))
      callback?.(
        '3tz doesnt contain hash file, hash info has been composed according to zip archive headers'
      );
    return archive;
  } catch (error) {
    await archive.close();
    throw error;
  }
}
