const EXT_PATTERN = /[^\.]+$/;

// Find a loader that works for extension/text
// Search the loaders array argument for a loader that matches extension or text
export function autoDetectLoader(url = '', text, loaders) {
  // Get extension
  let extension = url.match(EXT_PATTERN);
  if (extension && extension[0]) {
    extension = extension[0].toLowerCase();

    for (const loader of loaders) {
      if (loader.extension === extension || loader.name.toLowerCase() === extension) {
        return loader;
      }
    }
  }

  for (const loader of loaders) {
    if (loader.testText && loader.testText(text)) {
      return loader;
    }
  }

  return null;
}
