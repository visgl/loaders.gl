// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Uncapitalize first letter of a string
 * @param str
 * @returns
 */
export function uncapitalize(str: string): string {
  return typeof str === 'string' ? str.charAt(0).toLowerCase() + str.slice(1) : str;
}

/**
 * Recursively uncapitalize all keys in a nested object
 * @param object
 * @returns
 */
export function uncapitalizeKeys(object: any): any {
  if (Array.isArray(object)) {
    return object.map((element) => uncapitalizeKeys(element));
  }

  if (object && typeof object === 'object') {
    const newObject = {};
    for (const [key, value] of Object.entries(object)) {
      newObject[uncapitalize(key)] = uncapitalizeKeys(value);
    }
    return newObject;
  }

  return object;
}
