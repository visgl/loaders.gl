"use strict";module.export({readFileSync:()=>readFileSync});var fs;module.link('fs',{default(v){fs=v}},0);var toArrayBuffer;module.link('./utils/to-array-buffer.node',{toArrayBuffer(v){toArrayBuffer=v}},1);/* global Buffer */



const DEFAULT_OPTIONS = {
  dataType: 'arrayBuffer',
  // TODO - this was mostly set to true to make test cases work
  nothrow: true
};

// In a few cases (data URIs, node.js) "files" can be read synchronously
function readFileSync(url, options = {}) {
  options = getReadFileOptions(options);

  // Only support this if we can also support sync data URL decoding in browser
  // if (isDataURL(url)) {
  //   return decodeDataUri(url);
  // }

  if (!fs || !fs.readFileSync) {
    return null; // throw new Error('Cant load URI synchronously');
  }

  console.error(JSON.stringify(options, null, 2));
  const buffer = fs.readFileSync(url, options, () => {});
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
}

// HELPER FUNCTIONS

function getReadFileOptions(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  options.responseType = options.responseType || options.dataType;
  return options;
}
