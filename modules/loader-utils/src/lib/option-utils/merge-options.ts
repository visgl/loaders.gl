// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type RequiredOptions<T> = Required<{[K in keyof T]: Required<T[K]>}>;

export function getRequiredOptions<T>(options: T): RequiredOptions<T> {
  return options as RequiredOptions<T>;
}

/**
 *
 * @param baseOptions Can be undefined, in which case a fresh options object will be minted
 * @param newOptions
 * @returns
 */
export function mergeOptions<OptionsT extends Record<string, unknown>>(
  baseOptions: OptionsT | undefined,
  newOptions: OptionsT
): OptionsT {
  return mergeOptionsRecursively(baseOptions || {}, newOptions) as OptionsT;
}

function mergeOptionsRecursively(
  baseOptions: Record<string, unknown>,
  newOptions: Record<string, unknown>,
  level = 0
): Record<string, unknown> {
  // Sanity check (jest test runner overwrites the console object which can lead to infinite recursion)
  if (level > 3) {
    return newOptions;
  }

  const options = {...baseOptions};
  for (const [key, newValue] of Object.entries(newOptions)) {
    if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
      options[key] = mergeOptionsRecursively(
        (options[key] as Record<string, unknown>) || {},
        newOptions[key] as Record<string, unknown>,
        level + 1
      );
      // Object.assign(options[key] as object, newOptions[key]);
    } else {
      options[key] = newOptions[key];
    }
  }
  return options as Record<string, unknown>;
}
