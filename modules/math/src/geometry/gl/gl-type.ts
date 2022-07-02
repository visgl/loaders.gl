import type {TypedArray} from '@math.gl/core';
import {GL_TYPE as GL} from '../constants';

const GL_TYPE_TO_ARRAY_TYPE = {
  [GL.DOUBLE]: Float64Array,
  [GL.FLOAT]: Float32Array,
  [GL.UNSIGNED_SHORT]: Uint16Array,
  [GL.UNSIGNED_INT]: Uint32Array,
  [GL.UNSIGNED_BYTE]: Uint8Array,
  [GL.BYTE]: Int8Array,
  [GL.SHORT]: Int16Array,
  [GL.INT]: Int32Array
};
type GlTypeMap = {
  [index: string]: number;
};
const NAME_TO_GL_TYPE: GlTypeMap = {
  DOUBLE: GL.DOUBLE,
  FLOAT: GL.FLOAT,
  UNSIGNED_SHORT: GL.UNSIGNED_SHORT,
  UNSIGNED_INT: GL.UNSIGNED_INT,
  UNSIGNED_BYTE: GL.UNSIGNED_BYTE,
  BYTE: GL.BYTE,
  SHORT: GL.SHORT,
  INT: GL.INT
};
const ERR_TYPE_CONVERSION = 'Failed to convert GL type';
// Converts TYPED ARRAYS to corresponding GL constant
// Used to auto deduce gl parameter types
export default class GLType {
  // Signature: fromTypedArray(new Uint8Array())
  // Signature: fromTypedArray(Uint8Array)
  /**
   * Returns the size, in bytes, of the corresponding datatype
   * @param arrayOrType
   * @returns glType a a string
   */
  static fromTypedArray(arrayOrType: TypedArray | Function): string {
    // If typed array, look up constructor
    arrayOrType = ArrayBuffer.isView(arrayOrType) ? arrayOrType.constructor : arrayOrType;
    for (const glType in GL_TYPE_TO_ARRAY_TYPE) {
      const ArrayType = GL_TYPE_TO_ARRAY_TYPE[glType];
      if (ArrayType === arrayOrType) {
        return glType;
      }
    }
    throw new Error(ERR_TYPE_CONVERSION);
  }
  /**
   * Extracts name for glType from array NAME_TO_GL_TYPE
   * @param name
   * @returns glType as a number
   */
  static fromName(name: string): number {
    const glType = NAME_TO_GL_TYPE[name];
    if (!glType) {
      throw new Error(ERR_TYPE_CONVERSION);
    }
    return glType;
  }
  // Converts GL constant to corresponding typed array type
  // eslint-disable-next-line complexity
  static getArrayType(glType: number) {
    switch (glType) {
      /*eslint-disable*/
      // @ts-ignore
      case GL.UNSIGNED_SHORT_5_6_5:
      // @ts-ignore
      case GL.UNSIGNED_SHORT_4_4_4_4:
      // @ts-ignore
      case GL.UNSIGNED_SHORT_5_5_5_1:
        /* eslint-enable*/
        return Uint16Array;
      default:
        const ArrayType = GL_TYPE_TO_ARRAY_TYPE[glType];
        if (!ArrayType) {
          throw new Error(ERR_TYPE_CONVERSION);
        }
        return ArrayType;
    }
  }
  /**
   * Returns the size in bytes of one element of the provided WebGL type
   * @param glType
   * @returns size of glType
   */
  static getByteSize(glType: number): number {
    const ArrayType = GLType.getArrayType(glType);
    return ArrayType.BYTES_PER_ELEMENT;
  }
  /**
   * Returns `true` if `glType` is a valid WebGL data type.
   * @param glType
   * @returns boolean
   */
  static validate(glType: number): boolean {
    return Boolean(GLType.getArrayType(glType));
  }
  /**
   * Creates a typed view of an array of bytes
   * @param glType The type of typed array (ArrayBuffer view) to create
   * @param buffer The buffer storage to use for the view.
   * @param byteOffset The offset, in bytes, to the first element in the view
   * @param length The number of elements in the view. Defaults to buffer length
   * @returns A typed array view of the buffer
   */
  static createTypedArray(
    glType: number,
    buffer: TypedArray,
    byteOffset: number = 0,
    length?: number
  ): TypedArray {
    if (length === undefined) {
      length = (buffer.byteLength - byteOffset) / GLType.getByteSize(glType);
    }
    const ArrayType = GLType.getArrayType(glType);
    return new ArrayType(buffer, byteOffset, length);
  }
}
