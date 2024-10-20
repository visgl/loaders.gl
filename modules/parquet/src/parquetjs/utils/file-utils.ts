// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {stream} from '@loaders.gl/loader-utils';
import * as fs from 'fs';

export function load(name: string): any {
  return (module || (global as any)).require(name);
}
export interface WriteStreamOptions {
  flags?: string;
  encoding?: string;
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

export function oswrite(os: stream.Writable, buf: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    os.write(buf, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function osclose(os: stream.Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    (os as any).close((err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function osopen(path: string, opts?: WriteStreamOptions): Promise<fs.WriteStream> {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(path, opts as any);
    outputStream.once('open', (fd) => resolve(outputStream));
    outputStream.once('error', (err) => reject(err));
  });
}
