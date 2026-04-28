/* eslint-disable no-restricted-globals */
import type {CoreAPI} from '../sources/data-source';
import type {LoaderWithParser, LoaderOptions, LoaderContext} from '../../loader-types';
import {WorkerBody} from '@loaders.gl/worker-utils';
// import {validateLoaderVersion} from './validate-loader-version';

let requestId = 0;

type LoaderWorkerRegistry = Record<string, LoaderWithParser>;
type LoaderWorkerInput = LoaderWithParser | LoaderWithParser[] | LoaderWorkerRegistry;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 * @param loader
 */
export async function createLoaderWorker(loader: LoaderWorkerInput) {
  // Check that we are actually in a worker thread
  if (!(await WorkerBody.inWorkerThread())) {
    return;
  }

  const loaderRegistry = getLoaderRegistry(loader);
  const singleLoader = isLoaderWithParser(loader) ? loader : null;

  WorkerBody.onmessage = async (type, payload) => {
    switch (type) {
      case 'process':
        try {
          // validateLoaderVersion(loader, data.source.split('@')[1]);

          const {input, loaderId, options = {}, context = {}} = payload;
          const selectedLoader = selectLoader(loaderRegistry, singleLoader, loaderId);

          const result = await parseData({
            loader: selectedLoader,
            arrayBuffer: input,
            options,
            // @ts-expect-error fetch missing
            context: {
              ...context,
              coreApi: createWorkerCoreApi(),
              _parse: parseOnMainThread
            }
          });
          WorkerBody.postMessage('done', {result});
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          WorkerBody.postMessage('error', {error: message});
        }
        break;
      default:
    }
  };
}

/**
 * Selects the loader that should process a worker message.
 */
export function selectLoaderForWorkerMessage(
  loader: LoaderWorkerInput,
  loaderId?: string
): LoaderWithParser {
  const loaderRegistry = getLoaderRegistry(loader);
  const singleLoader = isLoaderWithParser(loader) ? loader : null;
  return selectLoader(loaderRegistry, singleLoader, loaderId);
}

function getLoaderRegistry(loader: LoaderWorkerInput): LoaderWorkerRegistry {
  if (isLoaderWithParser(loader)) {
    return {[loader.workerLoaderId || loader.id]: loader};
  }

  if (Array.isArray(loader)) {
    return Object.fromEntries(
      loader.map(loaderWithParser => [
        loaderWithParser.workerLoaderId || loaderWithParser.id,
        loaderWithParser
      ])
    );
  }

  return loader;
}

function isLoaderWithParser(loader: LoaderWorkerInput): loader is LoaderWithParser {
  return Boolean((loader as LoaderWithParser).id);
}

function selectLoader(
  loaderRegistry: LoaderWorkerRegistry,
  singleLoader: LoaderWithParser | null,
  loaderId?: string
): LoaderWithParser {
  if (!loaderId && singleLoader) {
    return singleLoader;
  }

  if (!loaderId) {
    throw new Error('loaderId is required when using a combined loader worker');
  }

  const selectedLoader = loaderRegistry[loaderId];
  if (!selectedLoader) {
    throw new Error(`No loader registered for loaderId ${loaderId}`);
  }

  return selectedLoader;
}

function createWorkerCoreApi(): CoreAPI {
  const unavailable = (methodName: keyof CoreAPI) => () => {
    throw new Error(`context.coreApi.${methodName} is unavailable inside worker loaders.`);
  };

  return {
    fetchFile: async urlOrData => await fetch(urlOrData as RequestInfo | URL),
    parseSync: unavailable('parseSync'),
    parse: unavailable('parse'),
    parseInBatches: unavailable('parseInBatches'),
    load: unavailable('load'),
    loadInBatches: unavailable('loadInBatches')
  };
}

function parseOnMainThread(
  arrayBuffer: ArrayBuffer,
  loader: any,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<void> {
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
