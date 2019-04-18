import {GL} from '../constants';

/**
 * Returns the size, in bytes, of the corresponding datatype.
 *
 * @param {Datatype} dataType The component datatype to get the size of.
 * @returns {Number} The size in bytes.
 *
 * @exception {DeveloperError} dataType is not a valid value.
 *
 * @example
 * // Returns Int8Array.BYTES_PER_ELEMENT
 * var size = Cesium.Datatype.getSizeInBytes(Cesium.Datatype.BYTE);
 */
export function getSizeInBytes(dataType) {
  if (!dataType) {
    throw new Error('value is required.');
  }

  switch (dataType) {
    case GL.BYTE:
      return Int8Array.BYTES_PER_ELEMENT;
    case GL.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case GL.SHORT:
      return Int16Array.BYTES_PER_ELEMENT;
    case GL.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case GL.INT:
      return Int32Array.BYTES_PER_ELEMENT;
    case GL.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
    case GL.FLOAT:
      return Float32Array.BYTES_PER_ELEMENT;
    case GL.DOUBLE:
      return Float64Array.BYTES_PER_ELEMENT;
    default:
      throw new Error('dataType is not a valid value.');
  }
}

/**
 * Gets the {@link Datatype} for the provided TypedArray instance.
 *
 * @param {TypedArray} array The typed array.
 * @returns {Datatype} The Datatype for the provided array, or undefined if the array is not a TypedArray.
 */
export function fromTypedArray(array) {
  if (array instanceof Int8Array) {
    return GL.BYTE;
  }
  if (array instanceof Uint8Array) {
    return GL.UNSIGNED_BYTE;
  }
  if (array instanceof Int16Array) {
    return GL.SHORT;
  }
  if (array instanceof Uint16Array) {
    return GL.UNSIGNED_SHORT;
  }
  if (array instanceof Int32Array) {
    return GL.INT;
  }
  if (array instanceof Uint32Array) {
    return GL.UNSIGNED_INT;
  }
  if (array instanceof Float32Array) {
    return GL.FLOAT;
  }
  if (array instanceof Float64Array) {
    return GL.DOUBLE;
  }

  throw new Error('array is not a valid TypedArray.');
}

/**
 * Validates that the provided component datatype is a valid {@link Datatype}
 *
 * @param {Datatype} dataType The component datatype to validate.
 * @returns {Boolean} <code>true</code> if the provided component datatype is a valid value; otherwise, <code>false</code>.
 *
 * @example
 * if (!Cesium.Datatype.validate(dataType)) {
 *   throw new Cesium.DeveloperError('dataType must be a valid value.');
 * }
 */
export function validate(dataType) {
  return (
    dataType &&
    (dataType === GL.BYTE ||
      dataType === GL.UNSIGNED_BYTE ||
      dataType === GL.SHORT ||
      dataType === GL.UNSIGNED_SHORT ||
      dataType === GL.INT ||
      dataType === GL.UNSIGNED_INT ||
      dataType === GL.FLOAT ||
      dataType === GL.DOUBLE)
  );
}

/**
 * Creates a typed array corresponding to component data type.
 *
 * @param {Datatype} dataType The component data type.
 * @param {Number|Array} valuesOrLength The length of the array to create or an array.
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} A typed array.
 *
 * @exception {DeveloperError} dataType is not a valid value.
 *
 * @example
 * // creates a Float32Array with length of 100
 * var typedArray = Cesium.Datatype.createTypedArray(Cesium.Datatype.FLOAT, 100);
 */
export function createTypedArray(dataType, valuesOrLength) {
  if (!dataType) {
    throw new Error('dataType is required.');
  }
  if (!valuesOrLength) {
    throw new Error('valuesOrLength is required.');
  }

  switch (dataType) {
    case GL.BYTE:
      return new Int8Array(valuesOrLength);
    case GL.UNSIGNED_BYTE:
      return new Uint8Array(valuesOrLength);
    case GL.SHORT:
      return new Int16Array(valuesOrLength);
    case GL.UNSIGNED_SHORT:
      return new Uint16Array(valuesOrLength);
    case GL.INT:
      return new Int32Array(valuesOrLength);
    case GL.UNSIGNED_INT:
      return new Uint32Array(valuesOrLength);
    case GL.FLOAT:
      return new Float32Array(valuesOrLength);
    case GL.DOUBLE:
      return new Float64Array(valuesOrLength);
    default:
      throw new Error('dataType is not a valid value.');
  }
}

/**
 * Creates a typed view of an array of bytes.
 *
 * @param {Datatype} dataType The type of the view to create.
 * @param {ArrayBuffer} buffer The buffer storage to use for the view.
 * @param {Number} [byteOffset] The offset, in bytes, to the first element in the view.
 * @param {Number} [length] The number of elements in the view.
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} A typed array view of the buffer.
 *
 * @exception {DeveloperError} dataType is not a valid value.
 */
/* eslint-disable complexity */
export function createArrayBufferView(dataType, buffer, byteOffset, length) {
  if (!dataType) {
    throw new Error('dataType is required.');
  }
  if (!buffer) {
    throw new Error('buffer is required.');
  }

  byteOffset = byteOffset || 0;
  length = length || (buffer.byteLength - byteOffset) / getSizeInBytes(dataType);

  switch (dataType) {
    case GL.BYTE:
      return new Int8Array(buffer, byteOffset, length);
    case GL.UNSIGNED_BYTE:
      return new Uint8Array(buffer, byteOffset, length);
    case GL.SHORT:
      return new Int16Array(buffer, byteOffset, length);
    case GL.UNSIGNED_SHORT:
      return new Uint16Array(buffer, byteOffset, length);
    case GL.INT:
      return new Int32Array(buffer, byteOffset, length);
    case GL.UNSIGNED_INT:
      return new Uint32Array(buffer, byteOffset, length);
    case GL.FLOAT:
      return new Float32Array(buffer, byteOffset, length);
    case GL.DOUBLE:
      return new Float64Array(buffer, byteOffset, length);
    default:
      throw new Error('dataType is not a valid value.');
  }
}
/* eslint-enable complexity */

/**
 * Get the Datatype from its name.
 *
 * @param {String} name The name of the Datatype.
 * @returns {Datatype} The Datatype.
 *
 * @exception {DeveloperError} name is not a valid value.
 */
export function fromName(name) {
  switch (name) {
    case 'BYTE':
      return GL.BYTE;
    case 'UNSIGNED_BYTE':
      return GL.UNSIGNED_BYTE;
    case 'SHORT':
      return GL.SHORT;
    case 'UNSIGNED_SHORT':
      return GL.UNSIGNED_SHORT;
    case 'INT':
      return GL.INT;
    case 'UNSIGNED_INT':
      return GL.UNSIGNED_INT;
    case 'FLOAT':
      return GL.FLOAT;
    case 'DOUBLE':
      return GL.DOUBLE;
    default:
      throw new Error('name is not a valid value.');
  }
}
