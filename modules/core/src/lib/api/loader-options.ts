// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '../../loader-utils/loader-types';

export {setGlobalOptions as setLoaderOptions} from '../loader-utils/option-utils';
export {getGlobalLoaderOptions as getLoaderOptions} from '../loader-utils/option-utils';

/**
 * Compares two option inputs without applying loader defaults or global options.
 * Compares plain objects and arrays recursively, and callbacks and other objects by reference.
 */
export function compareLoaderOptions(
  left: LoaderOptions | undefined,
  right: LoaderOptions | undefined
): boolean {
  return Object.is(left, right) || compareOptionValues(left, right, new WeakMap());
}

/** Compares option values and tracks visited object pairs to handle cycles. */
function compareOptionValues(
  left: unknown,
  right: unknown,
  visited: WeakMap<object, WeakSet<object>>
): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }

  const leftPrototype = Object.getPrototypeOf(left);
  if (leftPrototype !== Object.getPrototypeOf(right)) {
    return false;
  }
  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) {
      return false;
    }
  } else if (leftPrototype !== Object.prototype && leftPrototype !== null) {
    return false;
  }

  let rightValues = visited.get(left);
  if (rightValues?.has(right)) {
    return true;
  }
  if (!rightValues) {
    rightValues = new WeakSet();
    visited.set(left, rightValues);
  }
  rightValues.add(right);

  const leftKeys = getEnumerableKeys(left);
  const rightKeys = getEnumerableKeys(right);
  const leftOptions = left as Record<PropertyKey, unknown>;
  const rightOptions = right as Record<PropertyKey, unknown>;
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      key =>
        Object.prototype.propertyIsEnumerable.call(right, key) &&
        compareOptionValues(leftOptions[key], rightOptions[key], visited)
    )
  );
}

/** Returns own enumerable keys, including symbols. */
function getEnumerableKeys(value: object): PropertyKey[] {
  return Reflect.ownKeys(value).filter(key =>
    Object.prototype.propertyIsEnumerable.call(value, key)
  );
}
