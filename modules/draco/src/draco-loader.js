// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import DracoParser from './lib/draco-parser';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const DRACO = {
  id: 'draco',
  name: 'Draco',
  version: VERSION,
  extensions: ['drc'],
  mimeType: 'application/octet-stream',
  binary: true,
  test: 'DRACO'
};

export const DracoLoader = {
  ...DRACO,
  parse,
  options: {
    draco: {
      decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
      libraryPath: `libs/`
    }
  }
};

export const DracoWorkerLoader = {
  ...DRACO,
  options: {
    draco: {
      workerUrl: `https://unpkg.com/@loaders.gl/draco@${VERSION}/dist/draco-loader.worker.js`,
      libraryPath: `libs/`
    }
  }
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
