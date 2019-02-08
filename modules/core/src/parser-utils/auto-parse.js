// Find a loader that works for extension/text
export function autoParse(text, url, loaders, options) {
  const loader = autoDetectLoader(url, text, loaders);
  if (!loader.parseTextSync) {
    throw new Error(`${loader.name} loader cannot handle text`);
  }

  return loader.parseTextSync(text, options);
}

const EXT_PATTERN = /[^\.]+$/;

// Search the loaders array argument for a loader that matches extension or text
function autoDetectLoader(url, text, loaders) {
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
