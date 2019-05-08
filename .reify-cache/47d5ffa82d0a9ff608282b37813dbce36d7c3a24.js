"use strict";module.export({writeFile:()=>writeFile,writeFileSync:()=>writeFileSync});var isBrowser;module.link('../../utils/globals',{isBrowser(v){isBrowser=v}},0);var assert;module.link('../../utils/assert',{default(v){assert=v}},1);var node;module.link('../../node/fetch/write-file-node',{"*"(v){node=v}},2);



function writeFile(filePath, arrayBufferOrString, options) {
  if (!isBrowser) {
    return node.writeFile(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}

function writeFileSync(filePath, arrayBufferOrString, options) {
  if (!isBrowser) {
    return node.writeFileSync(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}
