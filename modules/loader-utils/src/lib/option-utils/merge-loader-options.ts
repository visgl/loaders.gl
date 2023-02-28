// loaders.gl, MIT license

import {LoaderOptions} from '../../types';

/**
 *
 * @param baseOptions Can be undefined, in which case a fresh options object will be minted
 * @param newOptions
 * @returns
 */
export function mergeLoaderOptions<Options extends LoaderOptions>(
  baseOptions: Options | undefined,
  newOptions: Options
): Options {
  const options = {...baseOptions};
  for (const [key, newValue] of Object.entries(newOptions)) {
    if (newValue && typeof newValue === 'object') {
      options[key] = options[key] || {};
      Object.assign(options[key] as object, newOptions[key]);
    } else {
      options[key] = newOptions[key];
    }
  }
  return options as Options;
}
