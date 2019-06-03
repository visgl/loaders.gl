// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import assert from './assert';

/**
 * A wrapper around arrays so that the internal length of the array can be manually managed.
 *
 * @alias ManagedArray
 * @constructor
 * @private
 *
 * @param {Number} [length=0] The initial length of the array.
 */
export default class ManagedArray {
  constructor(length = 0) {
    this._array = new Array(length);
    this._length = length;
  }

  /**
   * Gets or sets the length of the array.
   * If the set length is greater than the length of the internal array, the internal array is resized.
   *
   * @memberof ManagedArray.prototype
   * @type Number
   */
  get length() {
    return this._length;
  }

  set length(length) {
    this._length = length;
    if (length > this._array.length) {
      this._array.length = length;
    }
  }

  /**
   * Gets the internal array.
   *
   * @memberof ManagedArray.prototype
   * @type Array
   * @readonly
   */
  get values() {
    return this._array;
  }

  /**
   * Gets the element at an index.
   *
   * @param {Number} index The index to get.
   */
  get(index) {
    assert(index < this._array.length);
    return this._array[index];
  }

  /**
   * Sets the element at an index. Resizes the array if index is greater than the length of the array.
   *
   * @param {Number} index The index to set.
   * @param {*} element The element to set at index.
   */
  set(index, element) {
    assert(index >= 0);

    if (index >= this.length) {
      this.length = index + 1;
    }
    this._array[index] = element;
  }

  /**
   * Returns the last element in the array without modifying the array.
   *
   * @returns {*} The last element in the array.
   */
  peek() {
    return this._array[this._length - 1];
  }

  /**
   * Push an element into the array.
   *
   * @param {*} element The element to push.
   */
  push(element) {
    const index = this.length++;
    this._array[index] = element;
  }

  /**
   * Pop an element from the array.
   *
   * @returns {*} The last element in the array.
   */
  pop() {
    return this._array[--this.length];
  }

  /**
   * Resize the internal array if length > _array.length.
   *
   * @param {Number} length The length.
   */
  reserve(length) {
    assert(length >= 0);

    if (length > this._array.length) {
      this._array.length = length;
    }
  }

  /**
   * Resize the array.
   *
   * @param {Number} length The length.
   */
  resize(length) {
    assert(length >= 0);

    this.length = length;
  }

  /**
   * Trim the internal array to the specified length. Defaults to the current length.
   *
   * @param {Number} [length] The length.
   */
  trim(length = this.length) {
    this._array.length = length;
  }
}
