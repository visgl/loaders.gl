// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser, ReadableFile} from '@loaders.gl/loader-utils';
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
 */
export const SLPKLoaderWithParser = {
  ...SLPKLoaderMetadataWithoutPreload,
  parse: parseSLPK,
  parseFile: parseSLPKFile
} as const satisfies LoaderWithParser<ArrayBuffer, never, SLPKLoaderOptions>;

/**
 * Returns a single file from SLPK archive data.
 * @param data SLPK archive data
 * @param options SLPK loading options
 * @returns Requested file contents
 */
async function parseSLPK(data: ArrayBuffer, options: SLPKLoaderOptions = {}): Promise<ArrayBuffer> {
  return parseSLPKFile(new DataViewReadableFile(new DataView(data)), options);
}

/**
 * Returns a single file from a readable SLPK archive.
 * @param file SLPK archive readable file
 * @param options SLPK loading options
 * @returns Requested file contents
 */
async function parseSLPKFile(
  file: ReadableFile,
  options: SLPKLoaderOptions = {}
): Promise<ArrayBuffer> {
  const archive = await parseSLPKArchive(file);
  return archive.getFile(options.slpk?.path ?? '', options.slpk?.pathMode);
}
