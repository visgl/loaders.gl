import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {DracoMesh, DracoLoaderData} from './lib/draco-types';
import type {DracoLoaderOptions} from './draco-loader';
import {DracoLoader as DracoWorkerLoader} from './draco-loader';
import DracoParser from './lib/draco-parser';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';

// Draco data types

export type {DracoMesh, DracoLoaderData};

// Draco Writer

export type {DracoWriterOptions} from './draco-writer';
export {DracoWriter} from './draco-writer';
export const DracoWriterWorker = {
  id: 'draco-writer',
  name: 'Draco compressed geometry writer',
  module: 'draco',
  version: VERSION,
  options: {
    draco: {}
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
