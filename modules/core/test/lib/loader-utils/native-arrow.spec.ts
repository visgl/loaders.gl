// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {parseFile, parseInBatches} from '@loaders.gl/core';
import type {LoaderWithParser, ReadableFile} from '@loaders.gl/core/loader-utils';
import {
  usesNativeArrowBatches,
  getShapeOptionKey,
  normalizeNativeArrowBatches
} from '../../../src/lib/loader-utils/native-arrow';

const original = tableFromArrays({id: new Int32Array([1, 2])});
const table = new Table([original.slice(0, 1).batches[0], original.slice(1).batches[0]]);
const loader: LoaderWithParser = {
  id: 'native-test',
  name: 'Native test',
  module: 'test',
  version: '1',
  extensions: ['native'],
  mimeTypes: ['application/x-native'],
  options: {test: {shape: 'arrow'}},
  parse: async (_data, options) => {
    expect(options?.test?.shape).toBe('arrow');
    return table;
  }
};

test('native adapters retain table and batch identities and close the upstream iterator', async () => {
  let closed = false;
  let pulls = 0;
  async function* input() {
    try {
      yield {batchType: 'metadata'};
      yield {batchType: 'partial-result'};
      yield {batchType: 'final-result'};
      pulls++;
      yield table.batches[0];
      yield new Table([table.batches[1]]);
      pulls++;
      yield table;
    } finally {
      closed = true;
    }
  }
  const iterator = normalizeNativeArrowBatches(input())[Symbol.asyncIterator]();
  expect((await iterator.next()).value).toBe(table.batches[0]);
  expect((await iterator.next()).value).toBe(table.batches[1]);
  expect(pulls).toBe(1);
  await iterator.return?.();
  expect(closed).toBe(true);
  expect(pulls).toBe(1);
});

test('native adapters reject non-Arrow data instead of silently losing rows', async () => {
  const iterator = normalizeNativeArrowBatches([{batchType: 'data', shape: 'unknown', data: []}])[
    Symbol.asyncIterator
  ]();
  await expect(iterator.next()).rejects.toThrow('requires a native Arrow table or record batch');
});

test('native streaming selection validates the scoped shape and metadata options', () => {
  expect(usesNativeArrowBatches(loader, {test: {shape: 'arrow'}})).toBe(true);
  expect(usesNativeArrowBatches(loader, {test: {shape: 'object-row-table'}})).toBe(false);
  expect(() =>
    usesNativeArrowBatches(loader, {core: {metadata: true}, test: {shape: 'arrow'}})
  ).toThrow('does not support core.metadata envelopes');
  expect(getShapeOptionKey({...loader, options: {}})).toBeUndefined();
  expect(
    getShapeOptionKey({...loader, options: {first: {shape: 'x'}, second: {shape: 'y'}}})
  ).toBeUndefined();
  expect(
    getShapeOptionKey({...loader, options: {'native-test': {shape: 'x'}, second: {shape: 'y'}}})
  ).toBe('native-test');
});

test('native streaming handles atomic fallback without rewrapping native tables', async () => {
  const results = [];
  for await (const batch of await parseInBatches([new ArrayBuffer(0)], loader, {
    core: {worker: false, shape: 'arrow'}
  }))
    results.push(batch);
  expect(results).toEqual(table.batches);
});

test('parseFile retains native Arrow table identity', async () => {
  const fileLoader = {
    ...loader,
    parseFile: async (_file: ReadableFile, options) => {
      expect(options.test.shape).toBe('arrow');
      return table;
    }
  };
  expect(
    await parseFile({url: 'test.native'} as ReadableFile, fileLoader, {core: {shape: 'arrow'}})
  ).toBe(table);
});

test('schema-only Arrow tables do not invent a record batch', async () => {
  const empty = new Table(original.schema);
  const results = [];
  for await (const batch of normalizeNativeArrowBatches([empty])) results.push(batch);
  expect(results).toEqual([]);
});
