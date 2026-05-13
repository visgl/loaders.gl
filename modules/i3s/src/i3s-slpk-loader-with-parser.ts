// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';
import {SLPKLoader as SLPKLoaderMetadata} from './i3s-slpk-loader';

const {preload: _SLPKLoaderPreload, ...SLPKLoaderMetadataWithoutPreload} = SLPKLoaderMetadata;

/** options to load data from SLPK */
export type SLPKLoaderOptions = LoaderOptions & {
  slpk?: {
    /** path inside the slpk archive */
    path?: string;
    /** mode of the path */
    pathMode?: 'http' | 'raw';
  };
};

/**
 * Loader for SLPK - Scene Layer Package (Archive I3S format)
 * @todo - this reloads the entire archive for every tile, should be optimized
 * @todo - this should be updated to use `parseFile` and ReadableFile
 */
export const SLPKLoaderWithParser = {
  ...SLPKLoaderMetadataWithoutPreload,
  parse: async (data: ArrayBuffer, options: SLPKLoaderOptions = {}): Promise<ArrayBuffer> => {
    const archive = await parseSLPKArchive(new DataViewReadableFile(new DataView(data)));
    return archive.getFile(options.slpk?.path ?? '', options.slpk?.pathMode);
  }
} as const satisfies LoaderWithParser<ArrayBuffer, never, SLPKLoaderOptions>;
