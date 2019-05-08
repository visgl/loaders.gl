"use strict";module.export({writeFile:()=>writeFile,writeFileSync:()=>writeFileSync});var isBrowser;module.link('../../utils/globals',{isBrowser(v){isBrowser=v}},0);var assert;module.link('../../utils/assert',{default(v){assert=v}},1);var node;module.link('../../node/write-file.node',{"*"(v){node=v}},2);var resolvePath;module.link('./file-aliases',{resolvePath(v){resolvePath=v}},3);




function writeFile(filePath, arrayBufferOrString, options) {
  filePath = resolvePath(filePath);
  if (!isBrowser && node.writeFile) {
    return node.writeFile(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}

function writeFileSync(filePath, arrayBufferOrString, options) {
  filePath = resolvePath(filePath);
  if (!isBrowser && node.writeFileSync) {
    return node.writeFileSync(filePath, arrayBufferOrString, options);
  }
  return assert(false);
}
