"use strict";var DracoParser;module.link('./draco-parser',{default(v){DracoParser=v}},0);

function parseSync(arrayBuffer, options) {
  const dracoParser = new DracoParser();
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}

module.exportDefault({
  name: 'DRACO',
  extensions: ['drc'],
  parseSync
});
