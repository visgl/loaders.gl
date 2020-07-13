import {FileReadableResponse} from './fetch/fetch-file.browser';

export type LoaderObject = {
  id: string;
  name: string;
  version: string;
  extensions: string[];
  mimeTypes: string[];
  options: object;

  text?: boolean;
  binary?: boolean;

  parse?: (data: ArrayBuffer, options?: object) => Promise<any>;
  parseSync?: (data: ArrayBuffer, options?: object) => any;
  parseInBatches?: (data: AsyncIterator<any>, options?: object) => AsyncIterator<any>;
};

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

export type DataType = string | ArrayBuffer | Response | FileReadableResponse | File | Blob;
export type DataTypeOrPromise =
  string | ArrayBuffer | Response | FileReadableResponse | File | Blob |
  Promise<string> | Promise<ArrayBuffer> | Promise<Response> | Promise<FileReadableResponse> |
  Promise<File> | Promise<Blob>;

export type BatchableDataType = DataType | AsyncIterable<ArrayBuffer> | Promise<AsyncIterable<ArrayBuffer>>;
