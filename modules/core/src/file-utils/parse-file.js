import {autoDetectLoader} from '../loader-utils/auto-detect-loader';
import {parseWithLoader, parseWithLoaderSync} from '../loader-utils/parse-with-loader';

export function parseFile(data, url, loaders, options) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  // if (!loader.parseText) {
  //   throw new Error(`${loader.name} loader cannot handle text`);
  // }
  return parseWithLoader(data, url, loader, options);
}

export function parseFileSync(data, url, loaders, options) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  // if (!loader.parseText) {
  //   throw new Error(`${loader.name} loader cannot handle text`);
  // }
  return parseWithLoaderSync(data, url, loader, options);
}
