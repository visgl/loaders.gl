// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import DracoParser from './lib/draco-parser';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
      workerUrl: `https://unpkg.com/@loaders.gl/draco@${VERSION}/dist/draco-loader.worker.js`,
      localWorkerUrl: `modules/draco/dist/draco-loader.worker.dev.js`
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
    return dracoParser.parseSync(arrayBuffer);
  } finally {
    dracoParser.destroy();
  }
}
