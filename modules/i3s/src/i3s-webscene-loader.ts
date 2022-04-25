import type {LoaderWithParser, LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import type {I3SWebScene} from './types';

import {parseI3SWebscene} from './lib/parsers/parse-i3s-webscene';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'beta';
/**
 * Loader for I3S - Web Scene Layer
 */
export const I3SWebSceneLoader: LoaderWithParser = {
  name: 'I3S Web Scene Loader',
  id: 'i3s-web-scene',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  parse,
  extensions: ['json'],
  options: {}
};

async function parse(
  data: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<I3SWebScene> {
  if (!context?.url) {
    throw new Error('Url is not provided');
  }

  return parseI3SWebscene(data, context.url);
}
