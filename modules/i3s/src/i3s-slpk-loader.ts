import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {DataViewFile} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';

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
 * Loader for SLPK - Scene Layer Package (Archive I3S format)
 * @todo - this reloads the entire archive for every tile, should be optimized
 * @todo - this should be updated to use `parseFile` and ReadableFile
 */
export const SLPKLoader: LoaderWithParser<ArrayBuffer, never, SLPKLoaderOptions> = {
  name: 'I3S SLPK (Scene Layer Package)',
  id: 'slpk',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  extensions: ['slpk'],
  options: {},
  parse: async (data: ArrayBuffer, options: SLPKLoaderOptions = {}): Promise<ArrayBuffer> => {
    const archive = await parseSLPKArchive(new DataViewFile(new DataView(data)));
    return archive.getFile(options.slpk?.path ?? '', options.slpk?.pathMode);
  }
};
