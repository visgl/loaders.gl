import {LoaderOptions, LoaderWithParser, DataViewFile} from '@loaders.gl/loader-utils';
import {parseSLPK as parseSLPKFromProvider} from './lib/parsers/parse-slpk/parse-slpk';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
 * Loader for SLPK - Scene Layer Package
 */
export const SLPKLoader: LoaderWithParser<Buffer, never, SLPKLoaderOptions> = {
  name: 'I3S SLPK (Scene Layer Package)',
  id: 'slpk',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  parse: parseSLPK,
  extensions: ['slpk'],
  options: {}
};

/**
 * returns a single file from the slpk archive
 * @param data slpk archive data
 * @param options options
 * @returns requested file
 */

async function parseSLPK(data: ArrayBuffer, options: SLPKLoaderOptions = {}) {
  return (await parseSLPKFromProvider(new DataViewFile(new DataView(data)))).getFile(
    options.slpk?.path ?? '',
    options.slpk?.pathMode
  );
}
