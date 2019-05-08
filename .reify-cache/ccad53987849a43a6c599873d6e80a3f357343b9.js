"use strict";var module1=module;module1.export({createReadStream:()=>createReadStream,parseFile:()=>parseFile,parseFileSync:()=>parseFileSync,loadFile:()=>loadFile});var parse,parseSync;module1.link('./lib/parse',{parse(v){parse=v},parseSync(v){parseSync=v}},0);var fetchFile;module1.link('./lib/fetch/fetch-file',{fetchFile(v){fetchFile=v}},1);var load;module1.link('./lib/load',{load(v){load=v}},2);var resolvePath;module1.link('./lib/fetch/file-aliases',{resolvePath(v){resolvePath=v}},3);module1.link('./lib/fetch/file-aliases.js',{setPathPrefix:"setPathPrefix",getPathPrefix:"getPathPrefix",resolvePath:"resolvePath"},4);module1.link('./lib/fetch/fetch-file',{fetchFile:"fetchFile",readFileSync:"readFileSync"},5);module1.link('./lib/fetch/write-file',{writeFile:"writeFile",writeFileSync:"writeFileSync"},6);module1.link('./lib/register-loaders',{registerLoaders:"registerLoaders"},7);module1.link('./lib/parse',{parse:"parse",parseSync:"parseSync",parseInBatches:"parseInBatches",parseInBatchesSync:"parseInBatchesSync"},8);module1.link('./lib/load',{load:"load",loadInBatches:"loadInBatches"},9);module1.link('./lib/encode',{encode:"encode",encodeSync:"encodeSync",encodeInBatches:"encodeInBatches"},10);module1.link('./lib/save',{save:"save",saveSync:"saveSync"},11);module1.link('./javascript-utils/is-type',{isPromise:"isPromise",isIterable:"isIterable",isAsyncIterable:"isAsyncIterable",isIterator:"isIterator",isFetchResponse:"isFetchResponse",isReadableStream:"isReadableStream",isWritableStream:"isWritableStream"},12);module1.link('./javascript-utils/binary-utils',{isArrayBuffer:"isArrayBuffer",isBlob:"isBlob",toArrayBuffer:"toArrayBuffer",blobToArrayBuffer:"blobToArrayBuffer",toDataView:"toDataView"},13);module1.link('./javascript-utils/memory-copy-utils',{padTo4Bytes:"padTo4Bytes",copyToArray:"copyToArray",copyArrayBuffer:"copyArrayBuffer"},14);module1.link('./javascript-utils/stream-utils',{getStreamIterator:"getStreamIterator"},15);module1.link('./javascript-utils/async-iterator-utils',{forEach:"forEach",concatenateAsyncIterator:"concatenateAsyncIterator",lineAsyncIterator:"lineAsyncIterator",textDecoderAsyncIterator:"textDecoderAsyncIterator",numberedLineAsyncIterator:"numberedLineAsyncIterator"},16);module1.link('./worker-utils/create-worker',{default:"createWorker"},17);module1.link('./utils/globals',{isBrowser:"isBrowser",self:"self",window:"window",global:"global",document:"document"},18);module1.link('./utils/assert',{default:"assert"},19);module1.link('./categories/mesh/mesh-utils',{getMeshSize:"_getMeshSize"},20);




// FILE READING AND WRITING




// FILE PARSING AND ENCODING


// LOADING (READING + PARSING)



// ENCODING AND SAVING



// "JAVASCRIPT" UTILS




















// ITERATOR UTILS










// WORKER UTILS


// CORE UTILS



// MESH CATEGORY UTILS


// DEPRECATED

// Use @loaders.gl/polyfills and global symbols instead
/* global TextEncoder,TextDecoder */
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
  module.exports = {};
} else {
  module.exports = {TextEncoder, TextDecoder};
}

// Returns a promise that resolves to a readable stream
async function createReadStream(url, options) {
  // eslint-disable-next-line
  console.warn('createReadStream() deprecated, use fetch().then(resp => resp.body)');
  url = resolvePath(url);
  const response = await fetchFile(url, options);
  return response.body;
}

function parseFile(...args) {
  console.warn('parse() deprecated, use parse()'); // eslint-disable-line
  return parse(...args);
}

function parseFileSync(...args) {
  console.warn('parseSync() deprecated, use parseSync()'); // eslint-disable-line
  return parseSync(...args);
}

function loadFile(...args) {
  console.warn('loadFile() deprecated, use load()'); // eslint-disable-line
  return load(...args);
}
