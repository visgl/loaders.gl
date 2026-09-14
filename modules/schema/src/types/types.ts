// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Float16Array is declared in a separate TypeScript library. Preserve this reference so
// published declarations remain self-contained without changing the target or emitting runtime code.
// eslint-disable-next-line spaced-comment
/// <reference lib="es2025.float16" preserve="true" />

/** Any typed array */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float16Array
  | Float32Array
  | Float64Array;

export type BigTypedArray = TypedArray | BigInt64Array | BigUint64Array;

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float16ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type BigTypedArrayConstructor =
  | TypedArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

/** Any numeric array: typed array or `number[]` */
export type NumberArray = number[] | TypedArray;

export type NumericArray = number[] | TypedArray;

export interface ArrayType<T = unknown> {
  readonly length: number;
  [n: number]: T;
}

/** Any array: typed array or js array (`any[]`) */
export type AnyArray = any[] | TypedArray;
