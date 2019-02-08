import {readFile, readFileSync} from './read-file';
import {parseFile, parseFileSync} from './parse-file';

export function loadFile(url, loaders, options) {
  return readFile(url, options)
    .then(text => parseFile(text, url, loaders, options));
}

export function loadFileSync(url, loaders, options) {
  const data = readFileSync(url, options);
  const result = parseFileSync(data, loaders, options, url);
  // Separate return to facilitate breakpoint setting
  return result;
}
