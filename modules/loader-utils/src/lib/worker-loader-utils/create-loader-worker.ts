/* eslint-disable no-restricted-globals */
import type {LoaderWithParser, LoaderOptions, LoaderContext, Loader} from '../../loader-types';
import {createWorker} from '@loaders.gl/worker-utils';
// import {validateLoaderVersion} from './validate-loader-version';

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 * @param loader
 */
export async function createLoaderWorker(loader: LoaderWithParser) {
  await createWorker(
    async (input: any, options: {[key: string]: any} = {}, workerContext, loaderContext = {}) => {
      // validateLoaderVersion(loader, data.source.split('@')[1]);

      const result = await parseData({
        loader,
        arrayBuffer: input,
        options,
        context: {
          ...loaderContext,
          _parse: createParseOnMainThread(workerContext?.process)
        } as LoaderContext
      });

      return result;
    }
  );
}

/**
 * Create a loader context parse callback that redirects subloader parsing to the main thread.
 * @param processOnMainThread
 */
function createParseOnMainThread(
  processOnMainThread?: (data: any, options?: LoaderOptions, context?: Record<string, any>) => any
) {
  return (
    arrayBuffer: ArrayBuffer,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => {
    if (!processOnMainThread) {
      throw new Error('Worker not set up to parse on main thread');
    }

    const parseArguments = getMainThreadParseArguments(loaders, options, context);
    return processOnMainThread(arrayBuffer, parseArguments.options, parseArguments.context);
  };
}

/**
 * Extract parse options and context from the overloaded loader context parse signature.
 * @param loaders
 * @param options
 * @param context
 */
function getMainThreadParseArguments(
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): {options?: LoaderOptions; context?: Record<string, any>} {
  if (Array.isArray(loaders) && loaders.length > 0) {
    throw new Error('Worker nested parse cannot pass explicit loader arrays to the main thread');
  }
  if (loaders && !Array.isArray(loaders) && isLoaderObject(loaders)) {
    throw new Error('Worker nested parse cannot pass explicit loaders to the main thread');
  }
  if (options) {
    return {options, context: getSerializableLoaderContext(context)};
  }
  if (loaders && !Array.isArray(loaders)) {
    return {options: loaders};
  }
  return {options: undefined, context: getSerializableLoaderContext(context)};
}

/**
 * Checks whether a value is a loader object.
 * @param value
 */
function isLoaderObject(value: Loader | LoaderOptions): value is Loader {
  return 'id' in value && 'extensions' in value;
}

/**
 * Create a serializable loader context for a main-thread parse request.
 * @param context
 */
function getSerializableLoaderContext(context?: LoaderContext) {
  if (!context) {
    return undefined;
  }
  const {fetch, loaders, _parse, _parseSync, _parseInBatches, ...serializableContext} = context;
  return JSON.parse(JSON.stringify(serializableContext));
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
}: {
  loader: LoaderWithParser;
  arrayBuffer: ArrayBuffer;
  options: LoaderOptions;
  context: LoaderContext;
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
    core: {
      ...options.core,
      worker: false
    }
  };

  return await parser(data, {...options}, context, loader);
}
