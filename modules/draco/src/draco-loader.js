import DracoParser from './draco-parser';

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
  binary: true,
  test: 'DRACO',
  parseSync
};
