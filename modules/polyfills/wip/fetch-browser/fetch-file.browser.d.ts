// File reader fetch "polyfill" for the browser
export class FileReadableResponse {
  constructor(fileOrBlob, options);
  readonly headers: Headers;

  get ok(): boolean;
  get status(): number;

  // Note: This is just the file name without path information
  // Note: File has `name` field but the Blob baseclass does not
  get url(): string;

  arrayBuffer(): Promise<ArrayBuffer>;

  text(): Promise<string>;

  json(): Promise<any>;

  // TODO - body, how to support stream?
  // Can this be portable?
  // eslint-disable-next-line
  // https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams#Creating_your_own_custom_readable_stream
  // get body() {
  //   assert(false);
  // }
}

// @param {File|Blob} file  HTML File or Blob object to read as string
// @returns {Promise.string}  Resolves to a string containing file contents
export default function fetchFileReadable(fileOrBlob: File | Blob, options?: object);
