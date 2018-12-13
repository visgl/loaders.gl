/* global fetch */
export function loadFile(url, loader, options = {}) {
  // TODO: support progress and abort
  let dataType;
  let parser;

  if (loader.parseBinary) {
    dataType = 'arrayBuffer';
    parser = loader.parseBinary;
  } else if (loader.parseText) {
    dataType = 'text';
    parser = loader.parseText;
  } else {
    return Promise.reject(new Error(`Could not load ${url} using ${loader.name} loader`));
  }

  return fetch(url, options).then(res => res[dataType]()).then(data => parser(data, options));
}
