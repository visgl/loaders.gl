import {readFile, readFileSync} from '../fetch-file/fetch-file';
import {parseFile, parseFileSync} from '../parse-file/parse-file';
import {autoDetectLoader} from '../parse-file/auto-detect-loader';

export async function loadFile(url, loaders, options) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;
  // Some loaders can not separate reading and parsing of data (e.g ImageLoader)
  if (loader.loadAndParse) {
    return await loader.loadAndParse(url, options);
  }
  // at this point, data can be binary or text
  const data = await readFile(url, options);
  return parseFile(data, loaders, options, url);
}

export function loadFileSync(url, loaders, options) {
  const data = readFileSync(url, options);
  const result = parseFileSync(data, loaders, options, url);
  // Separate return to facilitate breakpoint setting
  return result;
}
