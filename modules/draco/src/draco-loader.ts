import type {WorkerLoaderObject, LoaderObject} from '@loaders.gl/loader-utils';
import type {DracoMeshData} from './types';
import type {DracoParseOptions} from './lib/draco-parser';
import DracoParser from './lib/draco-parser';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';

export type DracoLoaderOptions = DracoParseOptions & {
  decoderType?: 'wasm' | 'js';
  libraryPath?: string;
};

const DEFAULT_DRACO_OPTIONS: DracoLoaderOptions = {
  decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
  libraryPath: 'libs/',
  extraAttributes: {}
};

/**
 * Worker loader for Draco3D compressed geometries
 */
export const DracoWorkerLoader: WorkerLoaderObject = {
  name: 'Draco',
  id: 'draco',
  module: 'draco',
  version: VERSION,
  worker: true,
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO'],
  options: {
    draco: DEFAULT_DRACO_OPTIONS
  }
};

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoLoader: LoaderObject = {
  ...DracoWorkerLoader,
  parse
};

async function parse(
  arrayBuffer: ArrayBuffer,
  options: {draco?: DracoLoaderOptions},
  context
): Promise<DracoMeshData> {
  const {draco} = await loadDracoDecoderModule(options);
  const dracoParser = new DracoParser(draco);
  try {
    return dracoParser.parseSync(arrayBuffer, options.draco);
  } finally {
    dracoParser.destroy();
  }
}
