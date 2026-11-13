// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {parseFile, parseInBatches} from '@loaders.gl/core';
import type {LoaderWithParser, ReadableFile} from '@loaders.gl/core/loader-utils';
import {
  getNativeArrowOptions,
  getShapeOptionKey,
  unwrapArrowBatches,
  unwrapArrowTable
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
  options: {test: {shape: 'arrow-table'}},
  parse: async (_data, options) => {
    expect(options?.test?.shape).toBe('arrow-table');
    return {shape: 'arrow-table', data: table};
  }
};

test('native adapters retain table and batch identities and close the upstream iterator', async () => {
  expect(unwrapArrowTable({shape: 'arrow-table', data: table})).toBe(table);
  expect(unwrapArrowTable(table)).toBe(table);
  let closed = false;
  let pulls = 0;
  async function* input() {
    try {
      yield {batchType: 'metadata'};
      yield {batchType: 'partial-result'};
      yield {batchType: 'final-result'};
      pulls++;
      yield table.batches[0];
      yield {shape: 'arrow-table', data: new Table([table.batches[1]])};
      pulls++;
      yield {shape: 'arrow-table', data: table};
    } finally {
      closed = true;
    }
  }
  const iterator = unwrapArrowBatches(input())[Symbol.asyncIterator]();
  expect((await iterator.next()).value).toBe(table.batches[0]);
  expect((await iterator.next()).value).toBe(table.batches[1]);
  expect(pulls).toBe(1);
  await iterator.return?.();
  expect(closed).toBe(true);
  expect(pulls).toBe(1);
});

test('native adapters reject non-Arrow data instead of silently losing rows', async () => {
  expect(() => unwrapArrowTable({shape: 'object-row-table', data: []})).toThrow(
    'supports "arrow-table"'
  );
  const iterator = unwrapArrowBatches([{batchType: 'data', shape: 'unknown', data: []}])[
    Symbol.asyncIterator
  ]();
  await expect(iterator.next()).rejects.toThrow('supports "arrow-table"');
});

test('native selection copies options and handles shape namespaces', () => {
  const options = {core: {shape: 'arrow'}, test: {shape: 'arrow', other: true}};
  const internal = getNativeArrowOptions(loader, options);
  expect(internal).toEqual({
    core: {shape: 'arrow-table'},
    test: {shape: 'arrow-table', other: true}
  });
  expect(options.test.shape).toBe('arrow');
  expect(getNativeArrowOptions(loader, {test: {shape: 'arrow-table'}})).toBeNull();
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

test('parseFile unwraps after the file parser, retaining native object identity', async () => {
  const fileLoader = {
    ...loader,
    parseFile: async (_file: ReadableFile, options) => {
      expect(options.test.shape).toBe('arrow-table');
      return {shape: 'arrow-table', data: table};
    }
  };
  expect(
    await parseFile({url: 'test.native'} as ReadableFile, fileLoader, {core: {shape: 'arrow'}})
  ).toBe(table);
});

test('schema-only Arrow tables do not invent a record batch', async () => {
  const empty = new Table(original.schema);
  const results = [];
  for await (const batch of unwrapArrowBatches([{shape: 'arrow-table', data: empty}]))
    results.push(batch);
  expect(results).toEqual([]);
  expect(unwrapArrowTable({shape: 'arrow-table', data: empty}).schema).toBe(original.schema);
});
