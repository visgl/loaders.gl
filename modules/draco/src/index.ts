import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {DracoMesh, DracoLoaderData} from './lib/draco-types';
import type {DracoLoaderOptions} from './draco-loader';
import {DracoLoader as DracoWorkerLoader} from './draco-loader';
import DracoParser from './lib/draco-parser';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';
import {isBrowser} from '@loaders.gl/worker-utils';

// Draco data types

export type {DracoMesh, DracoLoaderData};

// Draco Writer

export type {DracoWriterOptions} from './draco-writer';
export {DracoWriter} from './draco-writer';

/**
 * Browser worker doesn't work because of issue during "draco_encoder.js" loading.
 * Refused to execute script from 'https://raw.githubusercontent.com/google/draco/1.4.1/javascript/draco_encoder.js' because its MIME type ('') is not executable.
 */
export const DracoWriterWorker = {
  id: isBrowser ? 'draco-writer' : 'draco-writer-nodejs',
  name: 'Draco compressed geometry writer',
  module: 'draco',
  version: VERSION,
  worker: true,
  options: {
    draco: {},
    source: null
  }
};

// Draco Loader

export type {DracoLoaderOptions};
export {DracoWorkerLoader};

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoLoader = {
  ...DracoWorkerLoader,
  parse
};

async function parse(arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions): Promise<DracoMesh> {
  const {draco} = await loadDracoDecoderModule(options);
  const dracoParser = new DracoParser(draco);
  try {
    return dracoParser.parseSync(arrayBuffer, options?.draco);
  } finally {
    dracoParser.destroy();
  }
}

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckDracoLoader: LoaderWithParser = DracoLoader;
