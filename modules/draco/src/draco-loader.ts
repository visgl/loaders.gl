import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/worker-utils';
import type {DracoParseOptions} from './lib/draco-parser';
// import type {DracoMeshData} from './types';
import {VERSION} from './lib/utils/version';

export type DracoLoaderOptions = LoaderOptions & {
  draco?: DracoParseOptions & {
    decoderType?: 'wasm' | 'js';
    libraryPath?: string;
    extraAttributes?;
    attributeNameEntry?: string;
    workerUrl?: string;
  };
};

const DEFAULT_DRACO_OPTIONS: DracoLoaderOptions = {
  draco: {
    decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
    libraryPath: 'libs/',
    extraAttributes: {},
    attributeNameEntry: undefined
  }
};

/**
 * Worker loader for Draco3D compressed geometries
 */
export const DracoLoader = {
  name: 'Draco',
  id: isBrowser ? 'draco' : 'draco-nodejs',
  module: 'draco',
  shapes: ['mesh'],
  version: VERSION,
  worker: true,
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO'],
  options: DEFAULT_DRACO_OPTIONS
};

export const _TypecheckDracoLoader: Loader = DracoLoader;
