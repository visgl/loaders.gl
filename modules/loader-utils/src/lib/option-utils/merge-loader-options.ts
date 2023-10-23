// loaders.gl, MIT license

import {LoaderOptions} from '../../loader-types';

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
  return mergeOptionsRecursively(baseOptions || {}, newOptions) as Options;
}

function mergeOptionsRecursively(
  baseOptions: Record<string, unknown>,
  newOptions: Record<string, unknown>
): Record<string, unknown> {
  const options = {...baseOptions};
  for (const [key, newValue] of Object.entries(newOptions)) {
    if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
      options[key] = mergeOptionsRecursively(
        (options[key] as Record<string, unknown>) || {},
        newOptions[key] as Record<string, unknown>
      );
      // Object.assign(options[key] as object, newOptions[key]);
    } else {
      options[key] = newOptions[key];
    }
  }
  return options as Record<string, unknown>;
}
