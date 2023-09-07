import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type POTreeLoaderOptions = LoaderOptions & {
  potree?: {};
};

/** Potree loader */
// @ts-ignore
export const PotreeLoader: LoaderWithParser<any, never, POTreeLoaderOptions> = {
  name: 'potree',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  testText: (text) => text.indexOf('octreeDir') >= 0,
  parseTextSync: (text) => JSON.parse(text),
  options: {
    potree: {}
  }
};
