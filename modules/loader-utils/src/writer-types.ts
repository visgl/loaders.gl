// loaders.gl, MIT license

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

  // encodeText?: EncodeText;
  // encode?: Encode;
  encodeSync?: EncodeSync;
  // encodeInBatches?: EncodeInBatches;
  encodeURLtoURL?: EncodeURLtoURL;

  encode?(data: DataT, options?: WriterOptionsT): Promise<ArrayBuffer>;
  encodeText?(table: DataT, options?: WriterOptionsT): Promise<string> | string;
  encodeInBatches?(data: AsyncIterable<any>, options?: WriterOptionsT): AsyncIterable<ArrayBuffer>;
};

//  type Encode = (data: any, options?: WriterOptions) => Promise<ArrayBuffer>;
type EncodeSync = (data: any, options?: WriterOptions) => ArrayBuffer;
// TODO
// type EncodeText = Function;
// type EncodeInBatches = Function;
type EncodeURLtoURL = (
  inputUrl: string,
  outputUrl: string,
  options?: WriterOptions
) => Promise<string>;

/** Typescript helper to extract the writer options type from a generic writer type */
export type WriterOptionsType<T = Writer> = T extends Writer<unknown, unknown, infer Options>
  ? Options
  : never;
/** Typescript helper to extract data type from a generic loader type */
export type WriterInputType<T = Writer> = T extends Writer<infer Return, any, any> ? Return : never;
/** Typescript helper to extract batch type from a generic loader type */
export type WriterBatchType<T = Writer> = T extends Writer<any, infer Batch, any> ? Batch : never;
