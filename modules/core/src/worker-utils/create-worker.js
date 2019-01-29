/* global TextDecoder, self */
import getTransferList from './get-transfer-list';

// Set up a WebWorkerGlobalScope to talk with the main thread
export default function createWorker(loader) {
  if (typeof self === 'undefined') {
    return;
  }

  self.onmessage = evt => {
    const {arraybuffer, opts} = evt.data;
    try {
      let data;
      let parser;
      if (loader.parseBinary) {
        data = arraybuffer;
        parser = loader.parseBinary;
      } else if (loader.parseText) {
        const textDecoder = new TextDecoder();
        data = textDecoder.decode(arraybuffer);
        parser = loader.parseText;
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
};
