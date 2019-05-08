"use strict";module.export({createReadStream:()=>createReadStream,parseFile:()=>parseFile,parseFileSync:()=>parseFileSync,loadFile:()=>loadFile});module.export({TextEncoder:()=>TextEncoder,TextDecoder:()=>TextDecoder},true);var parse,parseSync;module.link('./lib/parse',{parse(v){parse=v},parseSync(v){parseSync=v}},0);var fetchFile;module.link('./lib/fetch/fetch-file',{fetchFile(v){fetchFile=v}},1);var load;module.link('./lib/load',{load(v){load=v}},2);var resolvePath;module.link('./lib/fetch/file-aliases',{resolvePath(v){resolvePath=v}},3);var global;module.link('./utils/globals',{global(v){global=v}},4);module.link('./lib/fetch/file-aliases.js',{setPathPrefix:"setPathPrefix",getPathPrefix:"getPathPrefix",resolvePath:"resolvePath"},5);module.link('./lib/fetch/fetch-file',{fetchFile:"fetchFile"},6);module.link('./lib/fetch/read-file',{readFileSync:"readFileSync"},7);module.link('./lib/fetch/write-file',{writeFile:"writeFile",writeFileSync:"writeFileSync"},8);module.link('./lib/register-loaders',{registerLoaders:"registerLoaders"},9);module.link('./lib/parse',{parse:"parse",parseSync:"parseSync",parseInBatches:"parseInBatches",parseInBatchesSync:"parseInBatchesSync"},10);module.link('./lib/load',{load:"load",loadInBatches:"loadInBatches"},11);module.link('./lib/encode',{encode:"encode",encodeSync:"encodeSync",encodeInBatches:"encodeInBatches"},12);module.link('./lib/save',{save:"save",saveSync:"saveSync"},13);module.link('./javascript-utils/is-type',{isPromise:"isPromise",isIterable:"isIterable",isAsyncIterable:"isAsyncIterable",isIterator:"isIterator",isFetchResponse:"isFetchResponse",isReadableStream:"isReadableStream",isWritableStream:"isWritableStream"},14);module.link('./javascript-utils/binary-utils',{isArrayBuffer:"isArrayBuffer",isBlob:"isBlob",toArrayBuffer:"toArrayBuffer",blobToArrayBuffer:"blobToArrayBuffer",toDataView:"toDataView"},15);module.link('./javascript-utils/memory-copy-utils',{padTo4Bytes:"padTo4Bytes",copyToArray:"copyToArray",copyArrayBuffer:"copyArrayBuffer"},16);module.link('./javascript-utils/stream-utils',{getStreamIterator:"getStreamIterator"},17);module.link('./javascript-utils/async-iterator-utils',{forEach:"forEach",concatenateAsyncIterator:"concatenateAsyncIterator",lineAsyncIterator:"lineAsyncIterator",textDecoderAsyncIterator:"textDecoderAsyncIterator",numberedLineAsyncIterator:"numberedLineAsyncIterator"},18);module.link('./utils/globals',{isBrowser:"isBrowser",self:"self",window:"window",global:"global",document:"document"},19);module.link('./utils/assert',{default:"assert"},20);





// FILE READING AND WRITING





// FILE PARSING AND ENCODING


// LOADING (READING + PARSING)



// ENCODING AND SAVING



// "JAVASCRIPT" UTILS




















// ITERATOR UTILS










// CORE UTILS



// DEPRECATED

// Use @loaders.gl/polyfills and global symbols instead
const TextEncoder = global.TextEncoder;
const TextDecoder = global.TextDecoder;

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
