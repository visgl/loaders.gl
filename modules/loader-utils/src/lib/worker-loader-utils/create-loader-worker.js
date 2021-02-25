/* eslint-disable no-restricted-globals */
/* global TextDecoder, self */

import {WorkerBody} from '@loaders.gl/worker-utils';
// import {validateLoaderVersion} from './validate-loader-version';

let requestId = 0;

// TODO - rewrite, rebase on create-generic-worker
export function createLoaderWorker(loader) {
  // Check that we are actually in a worker thread
  if (typeof self === 'undefined') {
    return;
  }

  WorkerBody.onmessage = async (type, payload) => {
    switch (type) {
      case 'process':
        try {
          // validateLoaderVersion(loader, data.source.split('@')[1]);

          const {input, options = {}} = payload;

          const result = await parseData({
            loader,
            arrayBuffer: input,
            byteOffset: 0,
            byteLength: 0,
            options,
            context: {
              parse: parseOnMainThread
            }
          });
          WorkerBody.postMessage('done', {result});
        } catch (error) {
          WorkerBody.postMessage('error', {error: error.message});
        }
        break;
      default:
    }
  };
}

function parseOnMainThread(arrayBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;

    /**
     */
    const onMessage = (type, payload) => {
      if (payload.id !== id) {
        // not ours
        return;
      }

      switch (type) {
        case 'done':
          WorkerBody.removeEventListener(onMessage);
          resolve(payload.result);
          break;

        case 'error':
          WorkerBody.removeEventListener(onMessage);
          reject(payload.error);
          break;

        default:
        // ignore
      }
    };

    WorkerBody.addEventListener(onMessage);

    // Ask the main thread to decode data
    const payload = {id, input: arrayBuffer, options};
    WorkerBody.postMessage('process', payload);
  });
}

// TODO - Support byteOffset and byteLength (enabling parsing of embedded binaries without copies)
// TODO - Why not support async loader.parse* funcs here?
// TODO - Why not reuse a common function instead of reimplementing loader.parse* selection logic? Keeping loader small?
// TODO - Lack of appropriate parser functions can be detected when we create worker, no need to wait until parse
async function parseData({loader, arrayBuffer, byteOffset, byteLength, options, context}) {
  let data;
  let parser;
  if (loader.parseSync || loader.parse) {
    data = arrayBuffer;
    parser = loader.parseSync || loader.parse;
  } else if (loader.parseTextSync) {
    const textDecoder = new TextDecoder();
    data = textDecoder.decode(arrayBuffer);
    parser = loader.parseTextSync;
  } else {
    throw new Error(`Could not load data with ${loader.name} loader`);
  }

  // TODO - proper merge in of loader options...
  options = {
    ...options,
    modules: (loader && loader.options && loader.options.modules) || {},
    worker: false
  };

  return await parser(data, {...options}, context, loader);
}
