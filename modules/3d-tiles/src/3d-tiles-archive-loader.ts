// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {DataViewFile} from '@loaders.gl/loader-utils';
import {parse3DTilesArchive as parse3DTilesArchiveFromProvider} from './3d-tiles-archive/3d-tiles-archive-parser';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
export const Tiles3DArchiveFileLoader = {
  dataType: null as unknown as ArrayBuffer,
  batchType: null as never,
  name: '3tz',
  id: '3tz',
  module: '3d-tiles',
  version: VERSION,
  mimeTypes: ['application/octet-stream', 'application/vnd.maxar.archive.3tz+zip'],
  parse: parse3DTilesArchive,
  extensions: ['3tz'],
  options: {}
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
  const archive = await parse3DTilesArchiveFromProvider(new DataViewFile(new DataView(data)));
  return archive.getFile(options['3d-tiles-archive']?.path ?? '');
}
