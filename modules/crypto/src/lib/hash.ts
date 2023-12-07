// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

type HashOptions = {
  modules?: {[moduleName: string]: any};
  crypto?: {
    onEnd?: (result: {hash: string}) => any;
  };
};

/** Abstract hash base class */
export abstract class Hash {
  abstract readonly name: string;
  abstract readonly options: HashOptions;

  constructor(options: HashOptions = {}) {
    this.hashBatches = this.hashBatches.bind(this);
  }

  async preload(): Promise<void> {
    return;
  }

  abstract hash(arrayBuffer: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string>;

  async *hashBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    encoding: 'hex' | 'base64' = 'base64'
  ): AsyncIterable<ArrayBuffer> {
    const arrayBuffers: ArrayBuffer[] = [];
    for await (const arrayBuffer of asyncIterator) {
      arrayBuffers.push(arrayBuffer);
      yield arrayBuffer;
    }
    const output = await this.concatenate(arrayBuffers);
    const hash = await this.hash(output, encoding);
    this.options.crypto?.onEnd?.({hash});
  }

  // HELPERS

  protected async concatenate(asyncIterator): Promise<ArrayBuffer> {
    return await concatenateArrayBuffersAsync(asyncIterator);
  }
}
