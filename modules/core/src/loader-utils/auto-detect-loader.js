const EXT_PATTERN = /[^\.]+$/;

// Find a loader that works for extension/text
// Search the loaders array argument for a loader that matches extension or text
export function autoDetectLoader(url, text, loaders) {
  // Get extension without
  let extension = url.match(EXT_PATTERN) || url;
  if (extension.length && extension[0] === '.') {
    extension = extension.substr(1).toLowerCase();
  }

  for (const loader of loaders) {
    if (loader.extension === extension) {
      return loader;
    }
  }

  for (const loader of loaders) {
    if (loader.name.toLowerCase === extension) {
      return loader;
    }
  }

  for (const loader of loaders) {
    if (loader.testText && loader.testText(text)) {
      return loader;
    }
  }

  return null;
}
