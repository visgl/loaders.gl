// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// WRITERS

/** Options for writers */
export type WriterOptions = {
  /** worker source. If is set will be used instead of loading worker from the Internet */
  source?: string | null;
  /** Force to load WASM libraries from local file system in NodeJS or from loaders.gl CDN in a web browser */
  useLocalLibraries?: boolean;
  /** writer-specific options */
  [writerId: string]: any;
};

/**
 * A writer definition that can be used with `@loaders.gl/core` functions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Writer<DataT = unknown, BatchT = unknown, WriterOptionsT = WriterOptions> = {
  /** The result type of this loader  */
  dataType?: DataT;
  /** The batched result type of this loader  */
  batchType?: BatchT;

  /** Human readable name */
  name: string;
  /** id should be the same as the field used in LoaderOptions */
  id: string;
  /** module is used to generate worker threads, need to be the module directory name */
  module: string;
  /** Version should be injected by build tools */
  version: string;
  /** A boolean, or a URL */
  worker?: string | boolean;
  // end Worker

  /** Which category does this loader belong to */
  category?: string;
  /** File extensions that are potential matches with this loader. */
  extensions: string[];
  /** MIMETypes that indicate a match with this loader. @note Some MIMETypes are generic and supported by many loaders */
  mimeTypes?: string[];

  /** Is the input of this loader binary */
  binary?: boolean;
  /** Is the input of this loader text */
  text?: boolean;

  options: WriterOptionsT;
  deprecatedOptions?: Record<string, string>;
};

/**
 * A writer definition that can be used with `@loaders.gl/core` functions
 */
export type WriterWithEncoder<
  DataT = unknown,
  BatchT = unknown,
  WriterOptionsT = WriterOptions
> = Writer<DataT, BatchT, WriterOptionsT> & {
  encode?(data: DataT, options?: WriterOptionsT): Promise<ArrayBuffer>;
  encodeSync?(data: DataT, options?: WriterOptionsT): ArrayBuffer;

  encodeText?(table: DataT, options?: WriterOptionsT): Promise<string>;
  encodeTextSync?(table: DataT, options?: WriterOptionsT): string;

  encodeInBatches?(data: AsyncIterable<any>, options?: WriterOptionsT): AsyncIterable<ArrayBuffer>;

  encodeURLtoURL?: (
    inputUrl: string,
    outputUrl: string,
    options?: WriterOptionsT
  ) => Promise<string>;
};

/** Typescript helper to extract the writer options type from a generic writer type */
export type WriterOptionsType<T = Writer> = T extends Writer<unknown, unknown, infer Options>
  ? Options
  : never;
