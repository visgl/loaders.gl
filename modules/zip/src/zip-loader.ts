// Zip loader
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {extractAllFromZip} from './lib/parse-all';
import {FileMap} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ZipLoaderOptions = LoaderOptions & {
  zip?: {
    mode: 'all' | 'one';
  };
};

export const ZipLoader: LoaderWithParser<FileMap | ArrayBuffer, never, ZipLoaderOptions> = {
  id: 'zip',
  module: 'zip',
  name: 'Zip Archive',
  version: VERSION,
  extensions: ['zip'],
  mimeTypes: ['application/zip'],
  category: 'archive',
  tests: ['PK'],
  options: {
    zip: {
      mode: 'all'
    }
  },
  parse: parseZipAsync
};

async function parseZipAsync(data: ArrayBuffer, options?: ZipLoaderOptions) {
  switch (options?.zip?.mode) {
    case 'one':
      return data;
    case 'all':
    default: {
      return extractAllFromZip(data, options);
    }
  }
}

export const _typecheckZipLoader: LoaderWithParser<FileMap | ArrayBuffer, never, ZipLoaderOptions> =
  ZipLoader;
