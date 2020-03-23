/* eslint-disable no-restricted-globals */
/* global TextDecoder, self */

import {getTransferList} from './worker-utils/get-transfer-list';
import {validateLoaderVersion} from './validate-loader-version';

export default function createWorker(loader) {
  // TODO - explain when this happens? Just a sanity check? Throw an error or log a warning?
  if (typeof self === 'undefined') {
    return;
  }

  let requestId = 0;
  const parse = (arraybuffer, options = {}, url) =>
    new Promise((resolve, reject) => {
      const id = requestId++;

      const onMessage = ({data}) => {
        if (!data || data.id !== id) {
          // not ours
          return;
        }
        switch (data.type) {
          case 'parse-done':
            self.removeEventListener('message', onMessage);
            resolve(data.result);
            break;

          case 'parse-error':
            self.removeEventListener('message', onMessage);
            reject(data.message);
            break;

          default:
          // ignore
        }
      };
      self.addEventListener('message', onMessage);
      // Ask the main thread to decode data
      // @ts-ignore self is WorkerGlobalScope
      self.postMessage({type: 'parse', id, arraybuffer, options, url}, [arraybuffer]);
    });

  self.onmessage = async evt => {
    const {data} = evt;

    try {
      if (!isKnownMessage(data, loader.name)) {
        return;
      }

      validateLoaderVersion(loader, data.source.split('@')[1]);

      const {arraybuffer, byteOffset = 0, byteLength = 0, options = {}} = data;

      const result = await parseData({
        loader,
        arraybuffer,
        byteOffset,
        byteLength,
        options,
        context: {parse}
      });
      const transferList = getTransferList(result);
      // @ts-ignore self is WorkerGlobalScope
      self.postMessage({type: 'done', result}, transferList);
    } catch (error) {
      // @ts-ignore self is WorkerGlobalScope
      self.postMessage({type: 'error', message: error.message});
    }
  };
}

// TODO - Support byteOffset and byteLength (enabling parsing of embedded binaries without copies)
// TODO - Why not support async loader.parse* funcs here?
// TODO - Why not reuse a common function instead of reimplementing loader.parse* selection logic? Keeping loader small?
// TODO - Lack of appropriate parser functions can be detected when we create worker, no need to wait until parse
async function parseData({loader, arraybuffer, byteOffset, byteLength, options, context}) {
  let data;
  let parser;
  if (loader.parseSync || loader.parse) {
    data = arraybuffer;
    parser = loader.parseSync || loader.parse;
  } else if (loader.parseTextSync) {
    const textDecoder = new TextDecoder();
    data = textDecoder.decode(arraybuffer);
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

// Filter out noise messages sent to workers
function isKnownMessage(data, name) {
  return data && data.type === 'parse' && data.source && data.source.startsWith('loaders.gl');
}

/*
function checkMessage(evt, name) {
  switch (evt.data && evt.data.source) {
    // Ignore known noise event from react-dev-tools bridge, webpack build progress etc...
    case 'react-devtools-bridge':
    case 'react-devtools-content-script':
    case 'react-devtools-detector':
      return false;
    default:
      // fall through
  }

  switch (evt.data && evt.data.type) {
    case 'webpackProgress':
    case 'webpackOk':
      return false;
    default:
      // Enable to debug messages
      // const message = `${name.toLowerCase()}-worker: ignoring unknown message`;
      // console.log(message, evt.data, evt); // eslint-disable-line
      return false;
  }
}
*/
