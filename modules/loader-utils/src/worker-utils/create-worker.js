/* eslint-disable no-restricted-globals */
/* global TextDecoder, self, MessagePort */
import getTransferList from './get-transfer-list';

// Set up a WebWorkerGlobalScope to talk with the main thread
export default function createWorker(loader) {
  // TODO - explain when this happens? Just a sanity check? Throw an error or log a warning?
  if (typeof self === 'undefined') {
    return;
  }

  const loaders = {};

  const onmessage = async (port, evt) => {
    try {
      if (!isKnownMessage(evt, loader.name)) {
        return;
      }

      const {arraybuffer, byteOffset = 0, byteLength = 0, options = {}} = evt.data;

      for (const key in options) {
        if (typeof options[key] === 'string' && options[key].startsWith('loader#')) {
          options[key] = loaders[options[key].slice(7)];
        }
      }

      const result = await parseData(loader, arraybuffer, byteOffset, byteLength, options);
      const transferList = getTransferList(result);
      port.postMessage({type: 'done', result}, transferList);
    } catch (error) {
      port.postMessage({type: 'error', message: error.message});
    }
  };

  self.onmessage = evt => {
    const {data} = evt;
    if (data.__port) {
      data.__port.onmessage = onmessage.bind(null, data.__port);
    } else if (data.__loader) {
      loaders[data.__loader.name] = normalizeLoader(data.__loader);
    } else {
      onmessage(self, evt);
    }
  };
}

// TODO - Support byteOffset and byteLength (enabling parsing of embedded binaries without copies)
// TODO - Why not support async loader.parse* funcs here?
// TODO - Why not reuse a common function instead of reimplementing loader.parse* selection logic? Keeping loader small?
// TODO - Lack of appropriate parser functions can be detected when we create worker, no need to wait until parse
async function parseData(loader, arraybuffer, byteOffset, byteLength, options) {
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

  return await parser(data, options);
}

// Filter out noise messages sent to workers
function isKnownMessage(evt, name) {
  switch (evt.data && evt.data.source) {
    case 'loaders.gl':
      return true;

    default:
      // Uncomment to debug incoming messages
      // checkMessage(evt, name)
      return false;
  }
}

function normalizeLoader(loader) {
  if (loader.port instanceof MessagePort) {
    loader.parse = (arraybuffer, options) =>
      new Promise((resolve, reject) => {
        loader.port.onmessage = evt => {
          switch (evt.data.type) {
            case 'done':
              resolve(evt.data.result);
              return;

            case 'error':
              reject(evt.data.message);
              return;

            default:
          }
        };
        loader.port.postMessage({arraybuffer, options, source: 'loaders.gl'}, [arraybuffer]);
      });
  }
  return loader;
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
