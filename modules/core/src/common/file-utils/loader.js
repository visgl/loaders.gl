/* global fetch */
export function loadFile(url, loader, options = {}) {
  if (loader.parseBinary) {
    return fetch(url).then(res => res.arrayBuffer()).then(data => loader.parseBinary(data, options));
  }
  if (loader.parseText) {
    return fetch(url).then(res => res.text()).then(text => loader.parseText(text, options));
  }
  return Promise.reject(new Error(`Could not load ${url} using ${loader.name} loader`));
}
