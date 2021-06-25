/* eslint-disable no-restricted-globals */
import {createWorker} from '@loaders.gl/worker-utils'
import {WorkerBody} from '@loaders.gl/worker-utils';
// import {validateLoaderVersion} from './validate-loader-version';

let requestId = 0;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 * @param loader
 */
export function createLoaderWorker(loader: any) {
  createWorker(parseOnWorker)
  async function parseOnWorker(input: any, options: {[key: string]: any}, processOnMainThread): Promise<any> {
    // validateLoaderVersion(loader, data.source.split('@')[1]);

    const result = await parseData({
      loader,
      arrayBuffer: input,
      options,
      context: {
        parse: processOnMainThread
      }
    });

    return result;
  }
}

// TODO - Support byteOffset and byteLength (enabling parsing of embedded binaries without copies)
// TODO - Why not support async loader.parse* funcs here?
// TODO - Why not reuse a common function instead of reimplementing loader.parse* selection logic? Keeping loader small?
// TODO - Lack of appropriate parser functions can be detected when we create worker, no need to wait until parse
async function parseData({
  loader,
  arrayBuffer,
  options,
  context
}) {
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
