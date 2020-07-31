/**
 * A loader defintion that can be used with `@loaders.gl/core` functions
 */
export type LoaderObject = {
  id: string,
  name: string,
  category?: string;
  version: string,
  extensions: string[],
  mimeTypes: string[],
  options: object;
  deprecatedOptions?: object;

  binary?: boolean;
  text?: boolean;

  test?: ((ArrayBuffer) => boolean) | string | number;

  parse?: (arrayBuffer, options, context?) => Promise<any>;
  parseSync?: (arrayBuffer, options, context?) => any;
  parseText?: (string, options, context?) => Promise<any>;
  parseTextSync?: (string, options, context?) => any;
  parseInBatches?: (
    iterator: AsyncIterable<ArrayBuffer> | AsyncIterator<ArrayBuffer>, 
    options: object,
    context?: object
  ) => any;
  parseStreamInBatches?: (stream: ReadableStream, options: object, context?: object) => any;

  // TODO - deprecated
  supported?: boolean;
  testText?: (string) => boolean;
};

/**
 * A writer defintion that can be used with `@loaders.gl/core` functions
 */
export type WriterObject = {
  encode();
};

export type LoaderContext = {
  fetch?: any;
  loaders?: LoaderObject[];
  url?: string;

  parse?: (data: ArrayBuffer, options?: object) => Promise<any>;
  parseSync?: (data: ArrayBuffer, options?: object) => any;
  parseInBatches?: (data: AsyncIterator<any>, options?: object) => AsyncIterator<any>;
};

/** Types that can be synchronously parsed */
export type SyncDataType = string | ArrayBuffer; // TODO File | Blob can be read synchronously...

/** Types that can be parsed async */
export type DataType = string | ArrayBuffer | File | Blob | Response | ReadableStream;

/** Types that can be parsed in batches */
export type BatchableDataType =
  DataType |
  Iterable<ArrayBuffer> |
  AsyncIterable<ArrayBuffer> |
  Promise<AsyncIterable<ArrayBuffer>>;
