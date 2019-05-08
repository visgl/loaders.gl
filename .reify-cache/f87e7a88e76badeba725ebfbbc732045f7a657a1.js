"use strict";module.export({DracoWorkerLoader:()=>DracoWorkerLoader},true);module.link('./draco-loader',{default:"DracoLoader"},0);module.link('./draco-writer',{default:"DracoWriter"},1);module.link('./draco-parser',{default:"DracoParser"},2);module.link('./draco-builder',{default:"DracoBuilder"},3);var DracoParser;module.link('./draco-parser',{default(v){DracoParser=v}},4);





// DEPRECATED

// eslint-disable-next-line import/first


const DEPRECATION_WARNING = `\
DracoWorkerLoader must be imported from @loaders.gl/draco/worker-loader. \
Using DracoLoader instead`;

function parseSync(arrayBuffer, options) {
  // eslint-disable-next-line
  console.warn(DEPRECATION_WARNING);
  const dracoParser = new DracoParser();
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}

const DracoWorkerLoader = {
  name: 'DRACO',
  extensions: ['drc'],
  parseSync
};
