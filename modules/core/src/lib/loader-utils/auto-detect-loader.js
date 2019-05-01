import {normalizeLoader} from './normalize-loader';

const EXT_PATTERN = /[^.]+$/;

// Find a loader that works for extension/text
// Search the loaders array argument for a loader that matches extension or text
export function autoDetectLoader(url = '', text, loaders) {
  // Get extension
  // TODO - Would be nice to support http://example.com/file.glb?parameter=1
  // E.g: x = new URL('http://example.com/file.glb?load=1'; x.pathname
  const match = url.match(EXT_PATTERN);
  if (match && match[0]) {
    const extension = match[0];
    const loader = findLoaderByExtension(loaders, extension);
    if (loader) {
      return loader;
    }
  }

  const loader = findLoaderByExamingInitialData(loaders, text);
  if (loader) {
    return loader;
  }

  return null;
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

function findLoaderByExamingInitialData(loaders, text) {
  for (const loader of loaders) {
    if (loader.testText && loader.testText(text)) {
      return loader;
    }
  }
  return null;
}
