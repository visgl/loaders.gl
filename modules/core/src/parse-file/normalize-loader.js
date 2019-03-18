import assert from '../utils/assert';

export function normalizeLoader(loader) {
  validateLoaderObject(loader);

  normalizeLegacyLoaderObject(loader);

  // Ensure at least one of text/binary flags are properly set
  if (loader.parseTextSync) {
    loader.text = true;
  }
  if (!loader.text) {
    loader.binary = true;
  }
}

function validateLoaderObject(loader) {
  const hasParser =
    loader.parseTextSync ||
    loader.parseSync ||
    loader.parse ||
    loader.loadAndParse ||
    loader.parseStream || // Replace with parseInBatches
    loader.parseInBatches ||
    // loader.parseInBatchesSync || // Optimization only, parseInBatches needed
    loader.worker;
  assert(hasParser);
}

// Converts v0.5 loader object to v1.0
// TODO - update all loaders and remove this function
function normalizeLegacyLoaderObject(loader) {
  if (loader.parseBinary) {
    loader.parseSync = loader.parseBinary;
    // delete loader.parseBinary;
  }

  if (loader.parseText) {
    loader.parseTextSync = loader.parseText;
    // delete loader.parseText;
  }
}
