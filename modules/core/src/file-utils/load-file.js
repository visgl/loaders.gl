import {readFile, readFileSync} from './read-file';
import {autoParse} from '../parser-utils/auto-parse';

export function loadFile(url, loaders, options) {
  if (!Array.isArray(loaders)) {
    return loadFileOriginal(url, loaders, options);
  }
  return readFile(url, options)
    .then(text => autoParse(text, url, loaders, options));
}

export function loadFileSync(url, loaders, options) {
  return readFileSync(url, options)
    .then(data => autoParse(data, url, loaders, options));
}

// TODO this needs to be cleaned up/integrated with above
function loadFileOriginal(url, loader, options = {}) {
  // TODO: support progress and abort
  let parser;

  if (loader.parseBinary) {
    options.dataType = 'arrayBuffer';
    parser = loader.parseBinary;
  } else if (loader.parseText) {
    options.dataType = 'text';
    parser = loader.parseText;
  } else {
    return Promise.reject(new Error(`Could not load ${url} using ${loader.name} loader`));
  }

  return readFile(url, options).then(data => {
    // NOTE: keep this as two statements to facilitate breakpoint setting here when debugging
    const result = parser(data, options);
    return result;
  });
}
