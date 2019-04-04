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
  extension: 'drc',
  parseSync
};
