// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Recursively drop non serializable values like functions and regexps.
 * @param object
 */
export function removeNontransferableOptions(object: object | null): object {
  if (object === null) {
    return {};
  }
  const clone = Object.assign({}, object);

  Object.keys(clone).forEach((key) => {
    // Checking if it is an object and not a typed array.
    if (typeof object[key] === 'object' && !ArrayBuffer.isView(object[key])) {
      clone[key] = removeNontransferableOptions(object[key]);
    } else if (typeof clone[key] === 'function' || clone[key] instanceof RegExp) {
      clone[key] = {};
    } else {
      clone[key] = object[key];
    }
  });

  return clone;
}
