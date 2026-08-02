// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type Stat = {
  size: number;
  bigsize: bigint;
  isDirectory: boolean;
};

export interface ReadableFile {
  /** The underlying file handle (Blob, Node.js file descriptor etc) */
  readonly handle: unknown;
  /** Length of file in bytes, if available */
  readonly size: number;
  /** Length of file in bytes, if available */
  readonly bigsize: bigint;
  /** Url, if available */
  readonly url: string;

  /** Read data */
  read(start?: number | bigint, length?: number): Promise<ArrayBuffer>;
  /** Read data */
  fetchRange?(offset: number | bigint, length: number, signal?: AbortSignal): Promise<Response>;
  /** Get information about file */
  stat?(): Promise<Stat>;
  /** Close the file */
  close(): Promise<void>;
}

export interface WritableFile {
  handle: unknown;
  /** Write to file. The number of bytes written will be returned */
  write: (arrayBuffer: ArrayBuffer, offset?: number | bigint, length?: number) => Promise<number>;
  /** Get information about the file */
  stat?(): Promise<Stat>;
  /** Close the file */
  close(): Promise<void>;
}
