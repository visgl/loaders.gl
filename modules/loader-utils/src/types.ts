// Typed arrays

export type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;

export type TypedFloatArray = Uint16Array | Float32Array | Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;

export type BigTypedArray = TypedArray | BigInt64Array | BigUint64Array;

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type BigTypedArrayConstructor =
  | TypedArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

/** Any numeric array: typed array or `number[]` */
export type NumberArray = number[] | TypedArray;

export type NumericArray = number[] | TypedArray;

// FETCH

export type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

// MISC TYPES

export type TransformBatches = (
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
) => AsyncIterable<ArrayBuffer>;

/** Types that can be synchronously parsed */
export type SyncDataType = string | ArrayBuffer; // TODO File | Blob can be read synchronously...

/** Types that can be parsed async */
export type DataType =
  | string
  | ArrayBuffer
  | File
  | Blob
  | Response
  | ReadableStream
  | Iterable<ArrayBuffer>
  | AsyncIterable<ArrayBuffer>;

/** Types that can be parsed in batches */
export type BatchableDataType =
  | DataType
  | Iterable<ArrayBuffer>
  | AsyncIterable<ArrayBuffer>
  | Promise<AsyncIterable<ArrayBuffer>>;
