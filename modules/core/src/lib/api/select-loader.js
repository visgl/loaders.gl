import {normalizeLoader} from '../loader-utils/normalize-loader';
import {getResourceUrlAndType} from '../utils/resource-utils';
import {getRegisteredLoaders} from './register-loaders';

const EXT_PATTERN = /\.([^.]+)$/;

// TODO - Need a variant that peeks at streams for parseInBatches
// TODO - Detect multiple matching loaders? Use heuristics to grade matches?
// TODO - Allow apps to pass context to disambiguate between multiple matches (e.g. multiple .json formats)?

// eslint-disable-next-line complexity
export function selectLoader(data, loaders = [], options = {}, context = {}) {
  // if only a single loader was provided (not as array), force its use
  // TODO - Should this behaviour be kept and documented?
  if (loaders && !Array.isArray(loaders)) {
    return normalizeLoader(loaders);
  }

  // Add registered loaders
  loaders = [...(loaders || []), ...getRegisteredLoaders()];
  normalizeLoaders(loaders);

  const {url, type} = getResourceUrlAndType(data);

  let loader = findLoaderByUrl(loaders, url || context.url);
  loader = loader || findLoaderByContentType(loaders, type);
  loader = loader || findLoaderByExamingInitialData(loaders, data);

  // no loader available
  if (!loader && !options.nothrow) {
    throw new Error(getNoValidLoaderMessage(data, url, type));
  }

  return loader;
}

function getNoValidLoaderMessage(data, url, contentType) {
  let message = 'No valid loader found';
  if (data) {
    message += ` data: "${getFirstCharacters(data)}"`;
  }
  if (url) {
    message += ` for ${url}`;
  }
  return message;
}

function normalizeLoaders(loaders) {
  for (const loader of loaders) {
    normalizeLoader(loader);
  }
}

// TODO - Would be nice to support http://example.com/file.glb?parameter=1
// E.g: x = new URL('http://example.com/file.glb?load=1'; x.pathname
function findLoaderByUrl(loaders, url) {
  // Get extension
  const match = url && url.match(EXT_PATTERN);
  const extension = match && match[1];
  return extension && findLoaderByExtension(loaders, extension);
}

function findLoaderByExtension(loaders, extension) {
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
      if (testText(data, loader)) {
        return loader;
      }
    } else if (ArrayBuffer.isView(data)) {
      // Typed Arrays can have offsets into underlying buffer
      if (testBinary(data.buffer, data.byteOffset, loader)) {
        return loader;
      }
    } else if (data instanceof ArrayBuffer) {
      const byteOffset = 0;
      if (testBinary(data, byteOffset, loader)) {
        return loader;
      }
    }
    // TODO Handle streaming case (requires creating a new AsyncIterator)
  }
  return null;
}

function testText(data, loader) {
  return loader.testText && loader.testText(data);
}

function testBinary(data, byteOffset, loader) {
  const type = Array.isArray(loader.test) ? 'array' : typeof loader.test;
  switch (type) {
    case 'function':
      return loader.test(data, loader);

    case 'string':
    case 'array':
      // Magic bytes check: If `loader.test` is a string or array of strings,
      // check if binary data starts with one of those strings
      const tests = Array.isArray(loader.test) ? loader.test : [loader.test];
      return tests.some(test => {
        const magic = getMagicString(data, byteOffset, test.length);
        return test === magic;
      });

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
  if (arrayBuffer.byteLength <= byteOffset + length) {
    return '';
  }
  const dataView = new DataView(arrayBuffer);
  let magic = '';
  for (let i = 0; i < length; i++) {
    magic += String.fromCharCode(dataView.getUint8(byteOffset + i));
  }
  return magic;
}
