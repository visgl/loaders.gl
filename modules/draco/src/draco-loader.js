import DracoParser from './lib/draco-parser';

function parseSync(arrayBuffer, options) {
  const dracoParser = new DracoParser();
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}

export default {
  name: 'DRACO',
  extensions: ['drc'],
  mimeType: 'application/octet-stream',
  binary: true,
  test: 'DRACO',
  parse: async (arrayBuffer, options) => parseSync(arrayBuffer, options),
  parseSync
};
