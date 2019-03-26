import assert from '../utils/assert';

export function isLoaderObject(loader) {
  if (Array.isArray(loader)) {
    loader = loader[0];
  }

  const hasParser =
    loader.parseTextSync ||
    loader.parseSync ||
    loader.parse ||
    loader.loadAndParse ||
    loader.parseStream || // TODO Replace with parseInBatches
    loader.parseInBatches ||
    // loader.parseInBatchesSync || // Optimization only, parseInBatches needed
    loader.worker;

  return hasParser;
}

export function normalizeLoader(loader) {
  assert(isLoaderObject(loader));

  // If [loader, options], create a new loaders object with options merged in
  let options;
  if (Array.isArray(loader)) {
    loader = loader[0];
    options = loader[1];
    loader = {...loader, options: {...loader.options, options}};
  }

  // Ensure at least one of text/binary flags are properly set
  if (loader.parseTextSync) {
    loader.text = true;
  }
  if (!loader.text) {
    loader.binary = true;
  }
}
