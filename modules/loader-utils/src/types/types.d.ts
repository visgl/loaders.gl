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

  parse?: (arrayBuffer, options) => Promise<any>;
  parseSync?: (arrayBuffer, options) => any;
  parseText?: (string, options) => Promise<any>;
  parseTextSync?: (string, options) => any;
  parseInBatches?: (iterator: AsyncIterable<ArrayBuffer> | AsyncIterator<ArrayBuffer>, options: object) => any;

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
