"use strict";module.export({parseFile:()=>parseFile,parseFileSync:()=>parseFileSync,loadFile:()=>loadFile});module.link('./lib/fetch/file-aliases.js',{setPathPrefix:"setPathPrefix",getPathPrefix:"getPathPrefix",resolvePath:"resolvePath"},0);module.link('./lib/fetch/fetch-file',{fetchFile:"fetchFile",readFileSync:"readFileSync"},1);module.link('./lib/fetch/write-file',{writeFile:"writeFile",writeFileSync:"writeFileSync"},2);module.link('./lib/register-loaders',{registerLoaders:"registerLoaders"},3);module.link('./lib/parse',{parse:"parse",parseSync:"parseSync",parseInBatches:"parseInBatches",parseInBatchesSync:"parseInBatchesSync"},4);module.link('./lib/load',{load:"load",loadInBatches:"loadInBatches"},5);module.link('./lib/encode',{encode:"encode",encodeSync:"encodeSync",encodeInBatches:"encodeInBatches"},6);module.link('./lib/save',{save:"save",saveSync:"saveSync"},7);module.link('./javascript-utils/is-type',{isPromise:"isPromise",isIterable:"isIterable",isAsyncIterable:"isAsyncIterable",isIterator:"isIterator",isFetchResponse:"isFetchResponse",isReadableStream:"isReadableStream",isWritableStream:"isWritableStream"},8);module.link('./javascript-utils/binary-utils',{isArrayBuffer:"isArrayBuffer",isBlob:"isBlob",toArrayBuffer:"toArrayBuffer",blobToArrayBuffer:"blobToArrayBuffer",toDataView:"toDataView"},9);module.link('./javascript-utils/memory-copy-utils',{padTo4Bytes:"padTo4Bytes",copyToArray:"copyToArray",copyArrayBuffer:"copyArrayBuffer"},10);module.link('./javascript-utils/text-encoding',{TextDecoder:"TextDecoder",TextEncoder:"TextEncoder"},11);module.link('./javascript-utils/stream-utils',{getStreamIterator:"getStreamIterator"},12);module.link('./javascript-utils/async-iterator-utils',{forEach:"forEach",concatenateAsyncIterator:"concatenateAsyncIterator",lineAsyncIterator:"lineAsyncIterator",textDecoderAsyncIterator:"textDecoderAsyncIterator",numberedLineAsyncIterator:"numberedLineAsyncIterator"},13);module.link('./worker-utils/create-worker',{default:"createWorker"},14);module.link('./utils/globals',{isBrowser:"isBrowser",self:"self",window:"window",global:"global",document:"document"},15);module.link('./utils/assert',{default:"assert"},16);module.link('./categories/mesh/mesh-utils',{getMeshSize:"_getMeshSize"},17);module.link('./lib/fetch/fetch-file',{createReadStream:"createReadStream"},18);var parse,parseSync;module.link('./lib/parse',{parse(v){parse=v},parseSync(v){parseSync=v}},19);var load;module.link('./lib/load',{load(v){load=v}},20);// FILE READING AND WRITING




// FILE PARSING AND ENCODING


// LOADING (READING + PARSING)



// ENCODING AND SAVING



// "JAVASCRIPT" UTILS





















// ITERATOR UTILS










// WORKER UTILS


// CORE UTILS



// MESH CATEGORY UTILS


// DEPRECATED





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
