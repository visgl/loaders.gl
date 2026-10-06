// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseORC, parseORCStripeFooter} from '../src/lib/parsers/parse-orc';

/** Encodes an unsigned protobuf integer independently of the ORC writer. */
function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  do {
    const remainder = value % 128;
    value = Math.floor(value / 128);
    bytes.push(remainder | (value ? 128 : 0));
  } while (value);
  return bytes;
}

/** Encodes either an integer or a length-delimited protobuf field. */
function encodeField(number: number, value: number | number[] | string): number[] {
  if (typeof value === 'number') return [...encodeVarint(number * 8), ...encodeVarint(value)];
  const bytes = typeof value === 'string' ? [...new TextEncoder().encode(value)] : value;
  return [...encodeVarint(number * 8 + 2), ...encodeVarint(bytes.length), ...bytes];
}

/** Creates an ORC envelope with explicitly supplied metadata bytes. */
function createEnvelope(footer: number[], extraPostscript: number[] = [], body: number[] = []) {
  const postscript = [...encodeField(1, footer.length), ...encodeField(2, 0), ...extraPostscript];
  return Uint8Array.from([79, 82, 67, ...body, ...footer, ...postscript, postscript.length]).buffer;
}

// Unknown protobuf fields exercise all four skippable wire formats.
const UNKNOWN_FIELDS = [
  ...encodeField(20, 300),
  169,
  1,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  ...encodeField(22, [9, 10]),
  189,
  1,
  11,
  12,
  13,
  14
];

test('ORC metadata decodes packed and unpacked fields while skipping unknown fields', () => {
  const stream = [
    ...encodeField(1, 1),
    ...encodeField(2, 2),
    ...encodeField(3, 300),
    ...UNKNOWN_FIELDS
  ];
  const encoding = [...encodeField(1, 1), ...encodeField(2, 130), ...UNKNOWN_FIELDS];
  const stripeFooter = [
    ...encodeField(1, stream),
    ...encodeField(2, encoding),
    ...encodeField(2, encodeField(1, 0)),
    ...UNKNOWN_FIELDS
  ];
  const stripe = [
    ...encodeField(1, 3),
    ...encodeField(2, 0),
    ...encodeField(3, 0),
    ...encodeField(4, stripeFooter.length),
    ...encodeField(5, 257),
    ...UNKNOWN_FIELDS
  ];
  const rootType = [
    ...encodeField(1, 12),
    ...encodeField(2, [1, 2]),
    ...encodeField(2, 3),
    ...encodeField(3, 'value'),
    ...UNKNOWN_FIELDS
  ];
  const footer = [
    ...encodeField(1, 3),
    ...encodeField(2, stripeFooter.length),
    ...encodeField(3, stripe),
    ...encodeField(4, rootType),
    ...encodeField(4, encodeField(1, 7)),
    ...encodeField(6, 257),
    ...UNKNOWN_FIELDS
  ];
  const metadata = parseORC(
    createEnvelope(
      footer,
      [
        ...encodeField(3, 262144),
        ...encodeField(4, [0, 12]),
        ...encodeField(4, 13),
        ...encodeField(5, 129),
        ...encodeField(8000, 'ORC'),
        ...UNKNOWN_FIELDS
      ],
      stripeFooter
    )
  );

  expect(metadata.postscript).toEqual({
    footerLength: footer.length,
    compression: 'NONE',
    compressionBlockSize: 262144,
    version: [0, 12, 13],
    metadataLength: 129,
    magic: 'ORC'
  });
  expect(metadata.footer).toMatchObject({
    headerLength: 3,
    contentLength: stripeFooter.length,
    numberOfRows: 257,
    stripeCount: 1,
    typeCount: 2,
    fieldNames: ['value'],
    types: [
      {kind: 12, fieldNames: ['value'], subtypes: [1, 2, 3]},
      {kind: 7, fieldNames: [], subtypes: []}
    ],
    stripes: [
      {
        offset: 3,
        indexLength: 0,
        dataLength: 0,
        footerLength: stripeFooter.length,
        numberOfRows: 257,
        streams: [{kind: 1, column: 2, length: 300}],
        encodings: [
          {column: 0, kind: 1, dictionarySize: 130},
          {column: 1, kind: 0}
        ]
      }
    ]
  });
  expect(metadata.footer.raw).toEqual(Uint8Array.from(footer));
});

test('ORC leaves stripe metadata outside the available content undecoded', () => {
  const footer = encodeField(3, [...encodeField(1, 999), ...encodeField(4, 10)]);
  expect(parseORC(createEnvelope(footer)).footer.stripes).toEqual([
    {
      offset: 999,
      indexLength: 0,
      dataLength: 0,
      footerLength: 10,
      numberOfRows: 0
    }
  ]);
});

test.each([
  [[], 'Invalid ORC file magic'],
  [[79, 82, 0, 0], 'Invalid ORC file magic'],
  [[79, 82, 67, 255], 'Invalid ORC PostScript length'],
  [[79, 82, 67, 8, 10, 16, 0, 4], 'Invalid ORC footer length'],
  [[79, 82, 67, 8, 1, 16, 99, 4], 'Invalid ORC PostScript'],
  [[79, 82, 67, 16, 0, 2], 'Invalid ORC PostScript'],
  [[79, 82, 67, 8, 128, 2], 'Truncated ORC metadata']
])('ORC rejects malformed envelope %j', (bytes, error) => {
  expect(() => parseORC(Uint8Array.from(bytes).buffer)).toThrow(error);
});

test.each([
  [[26, 2, 0], 'Truncated ORC metadata'],
  [[128], 'Truncated ORC metadata'],
  [[163, 1], 'Unsupported ORC protobuf wire type 3'],
  [[169, 1, 0], 'Truncated ORC metadata'],
  [[189, 1, 0], 'Truncated ORC metadata']
])('ORC rejects truncated or unsupported footer fields %j', (footer, error) => {
  expect(() => parseORC(createEnvelope(footer))).toThrow(error);
});

test('ORC validates stripe footer bounds and unknown PostScript wire types', () => {
  expect(() =>
    parseORCStripeFooter(new Uint8Array(4), {
      offset: 3,
      indexLength: 0,
      dataLength: 0,
      footerLength: 2,
      numberOfRows: 0
    })
  ).toThrow('Truncated ORC stripe footer');
  expect(() => parseORC(createEnvelope([48, 0], [163, 1]))).toThrow(
    'Unsupported ORC protobuf wire type 3'
  );
});
