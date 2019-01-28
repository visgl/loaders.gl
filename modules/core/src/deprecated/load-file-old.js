import load from './load';

export function loadFile(url, loader, options = {}) {
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

  return load(url, options).then(data => {
    // NOTE: keep this as two statements to facilitate breakpoint setting here when debugging
    const result = parser(data, options);
    return result;
  });
}
