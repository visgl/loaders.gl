// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test} from 'vitest';
import {isBrowser, parse} from '@loaders.gl/core';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// const JSON_DATA = [{col1: 22, col2: 'abc'}];
// const JSONLoader = {
//   name: 'JSON',
//   extensions: ['json'],
//   testText: null,
//   parseTextSync: JSON.parse
// };

test.runIf(isBrowser)('parse#Blob (text)', async () => {});

test.runIf(isBrowser)('parse#Blob (binary)', async () => {
  console.log('Not implemented...');
});

test.runIf(isBrowser)('parse#Blob (streaming parser)', async () => {
  console.log('Not implemented...');
});

test('parse#Blob uses loader.parseBlob when available', async ({expect}) => {
  let parseBlobCalled = false;
  const loader = {
    id: 'blob-native-test-loader',
    name: 'Blob Native Test Loader',
    module: 'core',
    version: 'latest',
    extensions: ['bin'],
    mimeTypes: ['application/octet-stream'],
    binary: true,
    dataType: null as unknown as string,
    batchType: null as never,
    async parse() {
      throw new Error('parse should not be called for Blob-native loaders');
    },
    async parseBlob(blob: Blob) {
      parseBlobCalled = true;
      return await blob.text();
    }
  } as const satisfies LoaderWithParser<string>;

  const result = await parse(new Blob(['blob data'], {type: 'application/octet-stream'}), loader);

  expect(result).toBe('blob data');
  expect(parseBlobCalled).toBe(true);
});
