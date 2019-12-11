// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import DracoParser from './lib/draco-parser';

const env = process.env.NODE_ENV;
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

console.log(env)
const workerUrl = env === 'production' ?
  `https://unpkg.com/@loaders.gl/draco@${VERSION}/dist/draco-loader.worker.js` :
  'modules/draco/dist/draco-loader.worker.js';

export const DracoWorkerLoader = {
  id: 'draco',
  name: 'Draco',
  version: VERSION,
  extensions: ['drc'],
  mimeType: 'application/octet-stream',
  binary: true,
  test: 'DRACO',
  options: {
    draco: {
      decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
      libraryPath: `libs/`,
      workerUrl
    }
  }
};

export const DracoLoader = {
  ...DracoWorkerLoader,
  parse
};

async function parse(arrayBuffer, options, context, loader) {
  const {draco} = await loadDracoDecoderModule(options);

  const dracoParser = new DracoParser(draco);
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}
