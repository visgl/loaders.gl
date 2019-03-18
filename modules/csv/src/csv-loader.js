import {AsyncQueue} from '@loaders.gl/core';
import Papa from './papaparse/papaparse';
import AsyncIteratorStreamer from './papaparse/async-iterator-streamer';

export default {
  name: 'CSV',
  extension: 'csv',
  testText: null,
  parseInBatches: parseCSVStream
};

function parseCSVStream(asyncIterator, options) {
  const asyncQueue = new AsyncQueue();

  const config = {
    download: true,
    step(row) {
      // TODO batch before adding to queue.
      // console.log('Row:', row.data);
      asyncQueue.enqueue(row);
    },
    complete() {
      // console.log('All done!');
      asyncQueue.close();
    }
  };

  Papa.parse(asyncIterator, config, AsyncIteratorStreamer);

  // return asyncQueue[Symbol.asyncIterator]();
  return asyncQueue;
}
