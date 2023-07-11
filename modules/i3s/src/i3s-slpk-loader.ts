import {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseSLPK as parseSLPKFromProvider} from './lib/parsers/parse-slpk/parse-slpk';
import {DataViewFileProvider} from './lib/parsers/parse-zip/data-view-file-provider';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type SLPKLoaderOptions = LoaderOptions & {
  slpk?: {
    path?: string;
    pathMode?: 'http' | 'raw';
  };
};

async function parseSLPK(data: ArrayBuffer, options: SLPKLoaderOptions = {}) {
  return (await parseSLPKFromProvider(new DataViewFileProvider(new DataView(data)))).getFile(
    options.slpk?.path ?? '',
    options.slpk?.pathMode
  );
}

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
