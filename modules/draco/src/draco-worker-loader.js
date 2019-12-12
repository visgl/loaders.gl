// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import DracoParser from './lib/draco-parser';
import draco3d from 'draco3d';

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
    modules: {
      draco3d // Bundle full draco in worker to avoid tricky relative path loading from scripts
    },
    draco: {}
  },
  parse: async (arrayBuffer, options, context, loader) => {
    const {draco} = await loadDracoDecoderModule(options);
    const dracoParser = new DracoParser(draco);
    try {
      return dracoParser.parseSync(arrayBuffer, options);
    } finally {
      dracoParser.destroy();
    }
  }
};
