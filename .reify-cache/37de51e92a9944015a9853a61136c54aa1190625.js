"use strict";module.export({default:()=>createWorker});var getTransferList;module.link('./get-transfer-list',{default(v){getTransferList=v}},0);/* eslint-disable no-restricted-globals */
/* global TextDecoder, self */


// Set up a WebWorkerGlobalScope to talk with the main thread
function createWorker(loader) {
  if (typeof self === 'undefined') {
    return;
  }

  self.onmessage = evt => {
    const {arraybuffer, opts} = evt.data;
    try {
      let data;
      let parser;
      if (loader.parseSync) {
        data = arraybuffer;
        parser = loader.parseSync;
      } else if (loader.parseTextSync) {
        const textDecoder = new TextDecoder();
        data = textDecoder.decode(arraybuffer);
        parser = loader.parseTextSync;
      } else {
        throw new Error(`Could not load data with ${loader.name} loader`);
      }

      const result = parser(data, opts);
      const transferList = getTransferList(result);

      self.postMessage({type: 'done', result}, transferList);
    } catch (error) {
      self.postMessage({type: 'error', message: error.message});
    }
  };
}
