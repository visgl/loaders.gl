import type {
  LoaderWithParser,
  LoaderContext,
  LoaderOptions,
  Loader
} from '@loaders.gl/loader-utils';
import {compareArrayBuffers} from '@loaders.gl/loader-utils';
import {normalizeLoader} from '../loader-utils/normalize-loader';
import {getResourceUrlAndType} from '../utils/resource-utils';
import {getRegisteredLoaders} from './register-loaders';
import {readFileSlice} from '../../iterator-utils/make-iterator/blob-iterator';
import {isBlob} from '../../javascript-utils/is-type';

const EXT_PATTERN = /\.([^.]+)$/;

// TODO - Need a variant that peeks at streams for parseInBatches
// TODO - Detect multiple matching loaders? Use heuristics to grade matches?
// TODO - Allow apps to pass context to disambiguate between multiple matches (e.g. multiple .json formats)?

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders
 * @param options
 * @param context used internally, applications should not provide this parameter
 */
export async function selectLoader(
  data: Response | Blob | ArrayBuffer | string,
  loaders: Loader[] | Loader = [],
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<Loader | null> {
  // First make a sync attempt, disabling exceptions
  let loader = selectLoaderSync(data, loaders, {...options, nothrow: true}, context);
  if (loader) {
    return loader;
  }

  // For Blobs and Files, try to asynchronously read a small initial slice and test again with that
  // to see if we can detect by initial content
  if (isBlob(data)) {
    data = await readFileSlice(data as Blob, 0, 10);
    loader = selectLoaderSync(data, loaders, options, context);
  }

  // no loader available
  if (!loader && !options?.nothrow) {
    throw new Error(getNoValidLoaderMessage(data));
  }

  return loader;
}

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders
 * @param options
 * @param context used internally, applications should not provide this parameter
 */
export function selectLoaderSync(
  data: Response | Blob | ArrayBuffer | string,
  loaders: Loader[] | Loader = [],
  options?: LoaderOptions,
  context?: LoaderContext
): Loader | null {
  // eslint-disable-next-line complexity
  // if only a single loader was provided (not as array), force its use
  // TODO - Should this behavior be kept and documented?
  if (loaders && !Array.isArray(loaders)) {
    return normalizeLoader(loaders);
  }

  // Add registered loaders
  loaders = [...(loaders || []), ...getRegisteredLoaders()];
  normalizeLoaders(loaders);

  const {url, type} = getResourceUrlAndType(data);

  const testUrl = url || context?.url;
  let loader = findLoaderByUrl(loaders, testUrl);
  loader = loader || findLoaderByContentType(loaders, type);
  // NOTE: Initial data is not always available (e.g. Response, stream, async iterator)
  loader = loader || findLoaderByExamingInitialData(loaders, data);

  // no loader available
  if (!loader && !options?.nothrow) {
    throw new Error(getNoValidLoaderMessage(data));
  }

  return loader;
}

function getNoValidLoaderMessage(data): string {
  const {url, type} = getResourceUrlAndType(data);

  let message = 'No valid loader found';
  if (data) {
    message += ` data: "${getFirstCharacters(data)}", contentType: "${type}"`;
  }
  if (url) {
    message += ` url: ${url}`;
  }
  return message;
}

function normalizeLoaders(loaders: Loader[]): void {
  for (const loader of loaders) {
    normalizeLoader(loader);
  }
}

// TODO - Would be nice to support http://example.com/file.glb?parameter=1
// E.g: x = new URL('http://example.com/file.glb?load=1'; x.pathname
function findLoaderByUrl(loaders: Loader[], url?: string): Loader | null {
  // Get extension
  const match = url && EXT_PATTERN.exec(url);
  const extension = match && match[1];
  return extension ? findLoaderByExtension(loaders, extension) : null;
}

function findLoaderByExtension(loaders: Loader[], extension: string): Loader | null {
  extension = extension.toLowerCase();

  for (const loader of loaders) {
    for (const loaderExtension of loader.extensions) {
      if (loaderExtension.toLowerCase() === extension) {
        return loader;
      }
    }
  }
  return null;
}

function findLoaderByContentType(loaders, mimeType) {
  for (const loader of loaders) {
    if (loader.mimeTypes && loader.mimeTypes.includes(mimeType)) {
      return loader;
    }

    // Support referring to loaders using the "unregistered tree"
    // https://en.wikipedia.org/wiki/Media_type#Unregistered_tree
    if (mimeType === `application/x.${loader.id}`) {
      return loader;
    }
  }
  return null;
}

function findLoaderByExamingInitialData(loaders, data) {
  if (!data) {
    return null;
  }

  for (const loader of loaders) {
    if (typeof data === 'string') {
      if (testDataAgainstText(data, loader)) {
        return loader;
      }
    } else if (ArrayBuffer.isView(data)) {
      // Typed Arrays can have offsets into underlying buffer
      if (testDataAgainstBinary(data.buffer, data.byteOffset, loader)) {
        return loader;
      }
    } else if (data instanceof ArrayBuffer) {
      const byteOffset = 0;
      if (testDataAgainstBinary(data, byteOffset, loader)) {
        return loader;
      }
    }
    // TODO Handle streaming case (requires creating a new AsyncIterator)
  }
  return null;
}

function testDataAgainstText(data, loader) {
  if (loader.testText) {
    return loader.testText(data);
  }

  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some((test) => data.startsWith(test));
}

function testDataAgainstBinary(data, byteOffset, loader) {
  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some((test) => testBinary(data, byteOffset, loader, test));
}

function testBinary(data, byteOffset, loader, test) {
  if (test instanceof ArrayBuffer) {
    return compareArrayBuffers(test, data, test.byteLength);
  }
  switch (typeof test) {
    case 'function':
      return test(data, loader);

    case 'string':
      // Magic bytes check: If `test` is a string, check if binary data starts with that strings
      const magic = getMagicString(data, byteOffset, test.length);
      return test === magic;

    default:
      return false;
  }
}

function getFirstCharacters(data, length = 5) {
  if (typeof data === 'string') {
    return data.slice(0, length);
  } else if (ArrayBuffer.isView(data)) {
    // Typed Arrays can have offsets into underlying buffer
    return getMagicString(data.buffer, data.byteOffset, length);
  } else if (data instanceof ArrayBuffer) {
    const byteOffset = 0;
    return getMagicString(data, byteOffset, length);
  }
  return '';
}

function getMagicString(arrayBuffer, byteOffset, length) {
  if (arrayBuffer.byteLength < byteOffset + length) {
    return '';
  }
  const dataView = new DataView(arrayBuffer);
  let magic = '';
  for (let i = 0; i < length; i++) {
    magic += String.fromCharCode(dataView.getUint8(byteOffset + i));
  }
  return magic;
}
