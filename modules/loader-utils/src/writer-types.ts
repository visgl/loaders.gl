// loaders.gl, MIT license
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
  name: string;

  id: string;
  module: string;
  version: string;
  worker?: string | boolean;

  // TODO - are these are needed?
  extensions?: string[];
  mimeTypes?: string[];
  binary?: boolean;
  text?: boolean;

  options: WriterOptionsT;
  deprecatedOptions?: Record<string, string>;

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
