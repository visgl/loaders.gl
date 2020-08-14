/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import DracoParser from './lib/draco-parser';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const DracoWorkerLoader = {
  id: 'draco',
  name: 'Draco',
  version: VERSION,
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO'],
  options: {
    draco: {
      decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
      libraryPath: `libs/`,
      workerUrl: `https://unpkg.com/@loaders.gl/draco@${VERSION}/dist/draco-loader.worker.js`,
      localWorkerUrl: `modules/draco/dist/draco-loader.worker.dev.js`
    }
  }
};

/** @type {LoaderObject} */
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
    return dracoParser.parseSync(arrayBuffer);
  } finally {
    dracoParser.destroy();
  }
}
