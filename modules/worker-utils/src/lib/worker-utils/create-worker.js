/* eslint-disable no-restricted-globals */
/* global self */

import {getTransferList} from './get-transfer-list';

export function createWorker(processFunc) {
  // Check that we are actually in a worker thread
  if (typeof self === 'undefined') {
    return;
  }

  self.onmessage = async evt => {
    const {data} = evt;

    try {
      if (!isKnownMessage(data)) {
        return;
      }

      const result = await processFunc(data);

      const transferList = getTransferList(result);

      // @ts-ignore self is WorkerGlobalScope
      self.postMessage({type: 'done', result}, transferList);
    } catch (error) {
      // @ts-ignore self is WorkerGlobalScope
      self.postMessage({type: 'error', message: error.message});
    }
  };
}

// Filter out noise messages sent to workers
function isKnownMessage(data, type = 'parse') {
  return data && data.type === type && data.source && data.source.startsWith('loaders.gl');
}
