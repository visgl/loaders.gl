// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {parseORC} from '../src/lib/parsers/parse-orc';
import {ORCLoaderWithParser} from '../src/orc-loader';
import {ORCWriter} from '../src/orc-writer';

test('ORCLoader#parse validates the ORC envelope', () => {
  const postscript = Uint8Array.from([0x08, 0x04, 0x10, 0x00, 0x18, 0x00, 0x20, 0x01, 0x28, 0x00]);
  const footer = Uint8Array.from([0x30, 0x2a]);
  const bytes = new Uint8Array(3 + footer.length + postscript.length + 1);
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(footer, 3);
  bytes.set(postscript, 3 + footer.length);
  bytes[bytes.length - 1] = postscript.length;
  const result = parseORC(bytes.buffer);
  expect(result.format).toBe('orc');
  expect(result.postscript.compression).toBe('NONE');
  expect(result.footer.numberOfRows).toBe(42);
});

test('ORCLoader#parse returns an Arrow table', async () => {
  const output = await ORCWriter.encode({
    shape: 'object-row-table',
    schema: {fields: [{name: 'id', type: 'int32'}], metadata: {}},
    data: []
  });
  const result = await ORCLoaderWithParser.parse(output);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') expect(result.data.numRows).toBe(0);
});

test('ORCWriter#encode writes an empty ORC file', async () => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: []})
  });
  const result = parseORC(output);
  expect(result.postscript.compression).toBe('NONE');
  expect(result.footer.numberOfRows).toBe(0);
  expect(result.footer.typeCount).toBe(2);
});

test('ORCWriter#encode round-trips primitive Arrow columns', async () => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: [1, 2, 3], name: ['a', 'bb', '']})
  });
  const result = await ORCLoaderWithParser.parse(output);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') {
    expect(result.data.toArray()).toEqual([
      {id: 1, name: 'a'},
      {id: 2, name: 'bb'},
      {id: 3, name: ''}
    ]);
  }
});

test('ORCWriter#encode round-trips null-present columns', async () => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: [1, null, 3], name: ['a', null, 'c']})
  });
  const result = await ORCLoaderWithParser.parse(output);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table')
    expect(result.data.toArray()).toEqual([
      {id: 1, name: 'a'},
      {id: null, name: null},
      {id: 3, name: 'c'}
    ]);
});

test('ORCWriter#encode round-trips multiple stripes', async () => {
  const output = await ORCWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({id: [1, 2, 3, 4], name: ['a', 'b', 'c', 'd']})
    },
    {orc: {stripeSize: 2}}
  );
  const parsed = parseORC(output);
  expect(parsed.footer.stripeCount).toBe(2);
  const result = await ORCLoaderWithParser.parse(output);
  if (result.shape === 'arrow-table')
    expect(result.data.toArray()).toEqual([
      {id: 1, name: 'a'},
      {id: 2, name: 'b'},
      {id: 3, name: 'c'},
      {id: 4, name: 'd'}
    ]);
});

test('ORCLoader#parse reads stripe metadata', () => {
  const stripe = Uint8Array.from([0x08, 0x06, 0x10, 0x02, 0x18, 0x04, 0x20, 0x03, 0x28, 0x0a]);
  const footer = Uint8Array.from([0x1a, stripe.length, ...stripe, 0x30, 0x0a]);
  const postscript = Uint8Array.from([0x08, footer.length, 0x10, 0x00, 0x18, 0x00, 0x20, 0x01]);
  const bytes = new Uint8Array(3 + footer.length + postscript.length + 1);
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(footer, 3);
  bytes.set(postscript, 3 + footer.length);
  bytes[bytes.length - 1] = postscript.length;
  const result = parseORC(bytes.buffer);
  expect(result.footer.stripeCount).toBe(1);
  expect(result.footer.stripes[0].offset).toBe(3);
  expect(result.footer.stripes[0].numberOfRows).toBe(10);
});

test('ORCLoader#parse decodes an uncompressed RLEv2 delta integer column', async () => {
  const data = Uint8Array.from([0xc0, 0x02, 0x14, 0x04]);
  const stripeFooter = encodeMessage([
    [
      1,
      encodeMessage([
        [1, 1],
        [2, 1],
        [3, data.length]
      ])
    ],
    [2, encodeMessage([[1, 2]])]
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, 3]
  ]);
  const rootType = encodeMessage([
    [1, 12],
    [2, 1],
    [3, 'id']
  ]);
  const integerType = encodeMessage([[1, 3]]);
  const footer = encodeMessage([
    [3, stripeInformation],
    [4, rootType],
    [4, integerType],
    [6, 3]
  ]);
  const postscript = encodeMessage([
    [1, footer.length],
    [2, 0],
    [3, 262_144],
    [4, 0],
    [4, 12]
  ]);
  const bytes = new Uint8Array(
    3 + data.length + stripeFooter.length + footer.length + postscript.length + 1
  );
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(data, 3);
  bytes.set(stripeFooter, 3 + data.length);
  bytes.set(footer, 3 + data.length + stripeFooter.length);
  bytes.set(postscript, 3 + data.length + stripeFooter.length + footer.length);
  bytes[bytes.length - 1] = postscript.length;

  const result = await ORCLoaderWithParser.parse(bytes.buffer);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table')
    expect(result.data.getChild('id')?.toArray()).toEqual(new Int32Array([10, 12, 14]));
});

test('ORCLoader#parse decodes dictionary-encoded string columns', async () => {
  const indexes = Uint8Array.from([0x42, 0x02, 0x20]);
  const lengths = Uint8Array.from([0x44, 0x01, 0x50]);
  const dictionary = new TextEncoder().encode('abb');
  const data = concatBytes(indexes, lengths, dictionary);
  const stripeFooter = encodeMessage([
    [
      1,
      encodeMessage([
        [1, 1],
        [2, 1],
        [3, indexes.length]
      ])
    ],
    [
      1,
      encodeMessage([
        [1, 2],
        [2, 1],
        [3, lengths.length]
      ])
    ],
    [
      1,
      encodeMessage([
        [1, 3],
        [2, 1],
        [3, dictionary.length]
      ])
    ],
    [2, encodeMessage([[1, 12]])],
    [
      2,
      encodeMessage([
        [1, 1],
        [2, 2]
      ])
    ]
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, 3]
  ]);
  const rootType = encodeMessage([
    [1, 12],
    [2, 1],
    [3, 'name']
  ]);
  const stringType = encodeMessage([[1, 7]]);
  const footer = encodeMessage([
    [3, stripeInformation],
    [4, rootType],
    [4, stringType],
    [6, 3]
  ]);
  const postscript = encodeMessage([
    [1, footer.length],
    [2, 0],
    [3, 262_144],
    [4, 0],
    [4, 12]
  ]);
  const bytes = new Uint8Array(
    3 + data.length + stripeFooter.length + footer.length + postscript.length + 1
  );
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(data, 3);
  bytes.set(stripeFooter, 3 + data.length);
  bytes.set(footer, 3 + data.length + stripeFooter.length);
  bytes.set(postscript, 3 + data.length + stripeFooter.length + footer.length);
  bytes[bytes.length - 1] = postscript.length;

  const result = await ORCLoaderWithParser.parse(bytes.buffer);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table')
    expect(result.data.getChild('name')?.toArray()).toEqual(['a', 'bb', 'a']);
});

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(arrays.reduce((length, array) => length + array.length, 0));
  let offset = 0;
  for (const array of arrays) {
    output.set(array, offset);
    offset += array.length;
  }
  return output;
}

function encodeMessage(fields: Array<[number, number | string | Uint8Array]>): Uint8Array {
  const output: number[] = [];
  for (const [fieldNumber, value] of fields) {
    if (typeof value === 'number') {
      writeVarint(output, fieldNumber * 8);
      writeVarint(output, value);
    } else {
      const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
      writeVarint(output, fieldNumber * 8 + 2);
      writeVarint(output, bytes.length);
      output.push(...bytes);
    }
  }
  return Uint8Array.from(output);
}

function writeVarint(output: number[], value: number): void {
  while (value > 0x7f) {
    output.push((value & 0x7f) | 0x80);
    value = Math.floor(value / 128);
  }
  output.push(value);
}
