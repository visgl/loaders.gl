import {normalizeLoader} from './normalize-loader';

const EXT_PATTERN = /[^.]+$/;

// Find a loader that works for extension/text
// Search the loaders array argument for a loader that matches extension or text
export function autoDetectLoader(data, loaders, {url = ''} = {}) {
  let loader = null;
  loader = loader || findLoaderByUrl(loaders, url);
  loader = loader || findLoaderByExamingInitialData(loaders, data);
  return loader;
}

// TODO - Would be nice to support http://example.com/file.glb?parameter=1
// E.g: x = new URL('http://example.com/file.glb?load=1'; x.pathname
function findLoaderByUrl(loaders, url) {
  // Get extension
  const match = url.match(EXT_PATTERN);
  const extension = match && match[0];
  const loader = extension && findLoaderByExtension(loaders, extension);
  return loader;
}

function findLoaderByExtension(loaders, extension) {
  extension = extension.toLowerCase();

  for (const loader of loaders) {
    normalizeLoader(loader);
    for (const loaderExtension of loader.extensions) {
      if (loaderExtension.toLowerCase() === extension) {
        return loader;
      }
    }
  }
  return null;
}

function findLoaderByExamingInitialData(loaders, data) {
  for (const loader of loaders) {
    if (typeof data === 'string') {
      if (testText(data, loader)) {
        return loader;
      }
    } else if (data instanceof ArrayBuffer) {
      if (testBinary(data, loader)) {
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

function testBinary(data, loader) {
  const type = Array.isArray(loader.test) ? 'array' : typeof loader.test;
  switch (type) {
    case 'function':
      return loader.test(data, loader);

    case 'string':
    case 'array':
      // Magic bytes check: If `loader.test` is a string or array of strings,
      // check if binary data starts with one of those strings
      const byteOffset = 0;
      const tests = Array.isArray(loader.test) ? loader.test : [loader.test];

      return tests.some(test => {
        const magic = getMagicString(data, byteOffset, test.length);
        return test === magic;
      });

    default:
      return false;
  }
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
