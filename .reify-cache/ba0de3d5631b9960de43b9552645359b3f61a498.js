"use strict";module.export({writeFile:()=>writeFile,writeFileSync:()=>writeFileSync});var fs;module.link('fs',{default(v){fs=v}},0);var promisify;module.link('util',{promisify(v){promisify=v}},1);var assert;module.link('../../utils/assert',{default(v){assert=v}},2);



function writeFile(filePath, arrayBufferOrString) {
  return promisify(fs.writeFile)(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}

function writeFileSync(filePath, arrayBufferOrString) {
  return fs.writeFileSync(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}

// Convert (copy) ArrayBuffer to Buffer
// EXPORTED FOR TEST ONLY
function toBuffer(binaryData) {
  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    /* global Buffer */
    const buffer = new Buffer(binaryData.byteLength);
    const view = new Uint8Array(binaryData);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  return assert(false);
}
