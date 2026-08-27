// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import * as arrow from 'apache-arrow';
import {deflateSync, zlibSync} from 'fflate';
import {SnappyCompression} from '@loaders.gl/compression/snappy-compression';
import {ORCLoaderWithParser} from '../src/orc-loader';
import {ORCWriter} from '../src/orc-writer';
import {decompressORCStream, preloadORCCompression} from '../src/lib/parsers/orc-compression';

test('ORCLoader#parse decodes dictionary-encoded string columns', async t => {
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
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.getChild('name')?.toArray(), ['a', 'bb', 'a']);
  t.end();
});

test('ORC compression decodes framed ZLIB chunks', t => {
  const input = new TextEncoder().encode('orc-zlib');
  const compressed = zlibSync(input);
  const header = compressed.length << 1;
  const framed = new Uint8Array(compressed.length + 3);
  framed[0] = header & 0xff;
  framed[1] = (header >> 8) & 0xff;
  framed[2] = (header >> 16) & 0xff;
  framed.set(compressed, 3);
  t.deepEqual(Array.from(decompressORCStream(framed, 'ZLIB')), Array.from(input));
  t.end();
});

test('ORC compression decodes framed raw DEFLATE chunks', t => {
  const input = new TextEncoder().encode('orc-raw-deflate');
  const compressed = deflateSync(input);
  const header = compressed.length << 1;
  const framed = new Uint8Array(compressed.length + 3);
  framed[0] = header & 0xff;
  framed[1] = (header >> 8) & 0xff;
  framed[2] = (header >> 16) & 0xff;
  framed.set(compressed, 3);
  t.deepEqual(Array.from(decompressORCStream(framed, 'ZLIB')), Array.from(input));
  t.end();
});

test('ORC compression decodes framed Snappy chunks', async t => {
  await preloadORCCompression();
  const input = new TextEncoder().encode('orc-snappy');
  const compressed = new Uint8Array(new SnappyCompression().compressSync(input.buffer));
  const header = compressed.length << 1;
  const framed = new Uint8Array(compressed.length + 3);
  framed[0] = header & 0xff;
  framed[1] = (header >> 8) & 0xff;
  framed[2] = (header >> 16) & 0xff;
  framed.set(compressed, 3);
  t.deepEqual(Array.from(decompressORCStream(framed, 'SNAPPY')), Array.from(input));
  t.end();
});

test('ORCWriter#encode writes dictionary-encoded repeated strings', async t => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({name: ['a', 'bb', 'a', 'bb']})
  });
  const result = await ORCLoaderWithParser.parse(output);
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.getChild('name')?.toArray(), ['a', 'bb', 'a', 'bb']);
  t.end();
});

test('ORCWriter#encode writes dictionary-encoded repeated binary values', async t => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({payload: [new Uint8Array([1, 2]), new Uint8Array([1, 2])]})
  });
  const result = await ORCLoaderWithParser.parse(output);
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    t.deepEqual(
      result.data
        .getChild('payload')
        ?.toArray()
        .map(value => Array.from(value as Uint8Array)),
      [
        [1, 2],
        [1, 2]
      ]
    );
  }
  t.end();
});

test('ORCLoader#parse decodes patched-base RLEv2 integers', async t => {
  const data = Uint8Array.from([0x82, 0x03, 0x07, 0x21, 0x64, 0x18, 0xf8, 0x40]);
  const stripeFooter = encodeMessage([
    [
      1,
      encodeMessage([
        [1, 1],
        [2, 1],
        [3, data.length]
      ])
    ],
    [2, encodeMessage([[1, 12]])],
    [2, encodeMessage([[1, 2]])]
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, 4]
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
    [6, 4]
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
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    const values = result.data.getChild('id')?.toArray();
    t.deepEqual(Array.from(values || []), [100, 101, 102, 1000]);
  }
  t.end();
});

test('ORCLoader#parse reconstructs LIST child streams', async t => {
  const lengths = Uint8Array.from([0x44, 0x02, 0x81, 0x00]);
  const values = Uint8Array.from([0x48, 0x02, 0xa5, 0xb0]);
  const data = concatBytes(lengths, values);
  const stripeFooter = encodeMessage([
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
        [1, 1],
        [2, 2],
        [3, values.length]
      ])
    ],
    [2, encodeMessage([[1, 12]])],
    [2, encodeMessage([[1, 0]])],
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
    [3, 'items']
  ]);
  const listType = encodeMessage([
    [1, 10],
    [2, 2]
  ]);
  const integerType = encodeMessage([[1, 3]]);
  const footer = encodeMessage([
    [3, stripeInformation],
    [4, rootType],
    [4, listType],
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
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    const items = result.data.getChild('items');
    t.equal(items?.get(0)?.length, 2);
    t.equal(items?.get(0)?.get(0), 10);
    t.equal(items?.get(0)?.get(1), 11);
    t.equal(items?.get(1)?.length, 0);
    t.equal(items?.get(2)?.get(0), 12);
  }
  t.end();
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
