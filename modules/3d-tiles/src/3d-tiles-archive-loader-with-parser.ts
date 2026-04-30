// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {parse3DTilesArchive as parse3DTilesArchiveFromProvider} from './3d-tiles-archive/3d-tiles-archive-parser';
import {Tiles3DArchiveFileLoader as Tiles3DArchiveFileLoaderMetadata} from './3d-tiles-archive-loader';

const {
  preload: _Tiles3DArchiveFileLoaderPreload,
  ...Tiles3DArchiveFileLoaderMetadataWithoutPreload
} = Tiles3DArchiveFileLoaderMetadata;

/** options to load data from 3tz */
export type Tiles3DArchiveFileLoaderOptions = LoaderOptions & {
  '3d-tiles-archive'?: {
    /** path inside the 3tz archive */
    path?: string;
  };
};

/**
 * Loader for 3tz packages
 */
export const Tiles3DArchiveFileLoaderWithParser = {
  ...Tiles3DArchiveFileLoaderMetadataWithoutPreload,
  parse: parse3DTilesArchive
} satisfies LoaderWithParser<ArrayBuffer, never, Tiles3DArchiveFileLoaderOptions>;

/**
 * returns a single file from the 3tz archive
 * @param data 3tz archive data
 * @param options options
 * @returns requested file
 */
async function parse3DTilesArchive(
  data: ArrayBuffer,
  options: Tiles3DArchiveFileLoaderOptions = {}
): Promise<ArrayBuffer> {
  const archive = await parse3DTilesArchiveFromProvider(
    new DataViewReadableFile(new DataView(data))
  );
  return archive.getFile(options['3d-tiles-archive']?.path ?? '');
}
