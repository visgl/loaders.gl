// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {isBrowser} from '../env-utils/globals';
import * as fs from '../node/fs';
import type {Writable} from 'stream';

export type WritableFile = {
  write: (buf: Buffer) => Promise<void>;
  close: () => Promise<void>;
};

export interface WriteStreamOptions {
  flags?: string;
  encoding?: 'utf8';
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

/** Helper function to create an envelope reader for a binary memory input */
export function makeWritableFile(
  pathOrStream: string | Writable,
  options?: WriteStreamOptions
): WritableFile {
  if (isBrowser) {
    return {
      write: async () => {},
      close: async () => {}
    };
  }

  const outputStream: Writable =
    typeof pathOrStream === 'string' ? fs.createWriteStream(pathOrStream, options) : pathOrStream;
  return {
    write: async (buffer: Buffer) =>
      new Promise((resolve, reject) => {
        outputStream.write(buffer, (err) => (err ? reject(err) : resolve()));
      }),
    close: () =>
      new Promise((resolve, reject) => {
        (outputStream as any).close((err) => (err ? reject(err) : resolve()));
      })
  };
}
