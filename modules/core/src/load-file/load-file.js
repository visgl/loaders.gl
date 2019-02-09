import {readFile, readFileSync} from '../read-file/read-file';
import {parseFile, parseFileSync} from '../parse-file/parse-file';
import {autoDetectLoader} from '../parse-file/auto-detect-loader';

export function loadFile(url, loaders, options) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;
  // Some loaders can not separate reading and parsing of data (e.g ImageLoader)
  if (loader.loadAndParse) {
    return loader.loadAndParse(url, options);
  }
  return readFile(url, options)
    .then(text => parseFile(text, url, loaders, options));
}

export function loadFileSync(url, loaders, options) {
  const data = readFileSync(url, options);
  const result = parseFileSync(data, loaders, options, url);
  // Separate return to facilitate breakpoint setting
  return result;
}
