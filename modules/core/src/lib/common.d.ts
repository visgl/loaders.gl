import {FileReadableResponse} from './fetch/fetch-file.browser';

export type LoaderObject = {
  id: string,
  name: string,
  version: string,
  extensions: string[],
  mimeType: string,
  options: object;

  parse?: (arrayBuffer, options) => Promise<any>;
};

export type WriterObject = {
  encode();
};

export type DataType = string | ArrayBuffer | Response | FileReadableResponse | File | Blob;
export type DataTypeOrPromise =
  string | ArrayBuffer | Response | FileReadableResponse | File | Blob |
  Promise<string> | Promise<ArrayBuffer> | Promise<Response> | Promise<FileReadableResponse> |
  Promise<File> | Promise<Blob>;
