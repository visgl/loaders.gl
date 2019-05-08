"use strict";module.export({fetchFile:()=>fetchFile,readFileSync:()=>readFileSync,createReadStream:()=>createReadStream});var isBrowser;module.link('../../utils/globals',{isBrowser(v){isBrowser=v}},0);var node;module.link('../../node/fetch/fetch-file-node',{"*"(v){node=v}},1);var browserFetchFile,browserReadFileSync,browserCreateReadStream;module.link('./fetch-file-browser',{fetchFile(v){browserFetchFile=v},readFileSync(v){browserReadFileSync=v},createReadStream(v){browserCreateReadStream=v}},2);var resolvePath;module.link('./file-aliases',{resolvePath(v){resolvePath=v}},3);

// fetch-file-node is excluded from build under browser so don't do indivdual imports


// Import individual symbols for browser version to ensure tree-shaking is enabled








// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
async function fetchFile(url, options) {
  url = resolvePath(url);
  const func = isBrowser ? browserFetchFile : node.fetchFile;
  return func(url, options);
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
function readFileSync(url, options = {}) {
  url = resolvePath(url);
  const func = isBrowser ? browserReadFileSync : node.readFileSync;
  return func(url, options);
}

// DEPRECATED

// Returns a promise that resolves to a readable stream
async function createReadStream(url, options) {
  url = resolvePath(url);
  const func = isBrowser ? browserCreateReadStream : node.createReadStream;
  return func(url, options);
}
