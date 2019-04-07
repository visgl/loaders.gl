const EXT_PATTERN = /[^\.]+$/;

// Find a loader that works for extension/text
// Search the loaders array argument for a loader that matches extension or text
export function autoDetectLoader(url = '', text, loaders) {
  // Get extension
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
    for (const loaderExtension of loader.extensions || []) {
      if (loaderExtension.toLowerCase() === extension) {
        return loader;
      }
    }

    if (loader.extension && loader.extension.toLowerCase() === extension) {
      return loader;
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
