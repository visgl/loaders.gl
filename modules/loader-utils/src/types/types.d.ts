/**
 * A loader defintion that can be used with `@loaders.gl/core` functions
 */
export type LoaderObject = {
  id: string,
  name: string,
  version: string,
  extensions: string[],
  mimeType: string,
  options: object;

  parse?: (arrayBuffer, options) => Promise<any>;

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
