/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {VERSION} from './lib/utils/version';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import DracoParser from './lib/draco-parser';

/**
 * Worker loader for Draco3D compressed geometries
 * @type {WorkerLoaderObject}
 */
export const DracoWorkerLoader = {
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
    draco: {
      decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
      libraryPath: `libs/`,
      extraAttributes: {}
    }
  }
};

/**
 * Loader for Draco3D compressed geometries
 * @type {LoaderObject}
 */
export const DracoLoader = {
  ...DracoWorkerLoader,
  parse
};

async function parse(arrayBuffer, options, context, loader) {
  const {draco} = await loadDracoDecoderModule(options);
  const dracoParser = new DracoParser(draco);
  try {
    // TODO passing in options causes CI failures...
    // @ts-ignore
    return dracoParser.parseSync(arrayBuffer, {
      extraAttributes: (options.draco && options.draco.extraAttributes) || null,
      ...(options.parseOptions || {})
    });
  } finally {
    dracoParser.destroy();
  }
}
