// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import StreamingJSONParser from '../../../src/lib/json-parser/streaming-json-parser';
import FastStreamingJSONParser from '../../../src/lib/json-parser/fast-streaming-json-parser';

type StreamingParserConstructor = new (options?: {
  jsonpaths?: string[];
  metadata?: boolean;
  rawJsonUtf8Fields?: string[];
}) => {
  write(chunk: string): unknown[];
  close(): void;
  getPartialResult(): unknown;
  getStreamingJsonPathAsString(): string | null;
};

const PARSERS = [
  {name: 'StreamingJSONParser', Parser: StreamingJSONParser},
  {name: 'FastStreamingJSONParser', Parser: FastStreamingJSONParser}
];

const FEATURE_COLLECTION_JSON = JSON.stringify({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Snowman ☃',
        description: 'line\\nbreak',
        emoji: '😀'
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Escaped "quote"',
        unicode: '\u2028 kept as text'
      }
    }
  ]
});

const NESTED_ARRAY_JSON = JSON.stringify({
  data: {
    allData: [
      ['alpha', 'beta'],
      ['line\nbreak', 'emoji 😀'],
      ['unicode', '\u00E9']
    ]
  }
});

const ROOT_ARRAY_JSON = JSON.stringify([
  {id: 1, name: 'one'},
  {id: 2, name: 'two'},
  {id: 3, name: 'three'}
]);
const STRING_ARRAY_JSON = JSON.stringify(['alpha', 'emoji 😀', 'line\nbreak', 'escaped "quote"']);
const RAW_UTF8_ROW_JSON =
  '[{"metadata": { "nested" : [1, {"escaped":"\\u2603"}] }, "tags": [ "alpha" , {"value":2} ], "label":"line\\nbreak"}]';

test('FastStreamingJSONParser matches current parser for $.features across chunk sizes', t => {
  for (const chunkSize of [1, 2, 3, 5, 13]) {
    const expected = collectParserOutput(StreamingJSONParser, FEATURE_COLLECTION_JSON, chunkSize, [
      '$.features'
    ]);
    const actual = collectParserOutput(
      FastStreamingJSONParser,
      FEATURE_COLLECTION_JSON,
      chunkSize,
      ['$.features']
    );

    t.deepEqual(actual.rows, expected.rows, `rows match at chunk size ${chunkSize}`);
    t.deepEqual(
      actual.partialResult,
      expected.partialResult,
      `partial result matches at chunk size ${chunkSize}`
    );
    t.deepEqual(
      actual.finalResult,
      expected.finalResult,
      `final result matches at chunk size ${chunkSize}`
    );
    t.equal(actual.jsonpath, '$.features', `jsonpath matches at chunk size ${chunkSize}`);
  }

  t.end();
});

test('Streaming parsers match for nested array rows across chunk sizes', t => {
  for (const {name, Parser} of PARSERS) {
    const output = collectParserOutput(Parser, NESTED_ARRAY_JSON, 1, ['$.data.allData']);
    t.equal(output.rows.length, 3, `${name} found all rows`);
    t.deepEqual(
      output.finalResult,
      JSON.parse(NESTED_ARRAY_JSON),
      `${name} final result is correct`
    );
    t.equal(output.jsonpath, '$.data.allData', `${name} jsonpath is correct`);
  }

  t.end();
});

test('Streaming parsers match for root array chunk boundaries', t => {
  const expected = collectParserOutput(StreamingJSONParser, ROOT_ARRAY_JSON, 2);
  const actual = collectParserOutput(FastStreamingJSONParser, ROOT_ARRAY_JSON, 2);

  t.deepEqual(actual.rows, expected.rows, 'rows match for root array');
  t.equal(actual.jsonpath, '$', 'jsonpath is root array');

  t.end();
});

test('Streaming parsers match for scalar string array chunk boundaries', t => {
  const expected = collectParserOutput(StreamingJSONParser, STRING_ARRAY_JSON, 1);
  const actual = collectParserOutput(FastStreamingJSONParser, STRING_ARRAY_JSON, 1);

  t.deepEqual(actual.rows, expected.rows, 'rows match for string array');
  t.equal(actual.jsonpath, '$', 'jsonpath is root array');

  t.end();
});

test('FastStreamingJSONParser handles primitive array rows', t => {
  const output = collectParserOutput(FastStreamingJSONParser, '[1, true, null, -2.5]', 2);

  t.deepEqual(output.rows, [1, true, null, -2.5], 'primitive rows are emitted');
  t.equal(output.jsonpath, '$', 'jsonpath is root array');
  t.ok(output.rawJsonPath, 'raw JSONPath object is available');
  t.end();
});

test('FastStreamingJSONParser preserves configured raw Utf8 object and array fields', t => {
  const parser = new FastStreamingJSONParser({
    rawJsonUtf8Fields: ['metadata', 'tags']
  });
  const rows: unknown[] = [];

  for (const chunk of splitIntoChunks(RAW_UTF8_ROW_JSON, 1)) {
    rows.push(...parser.write(chunk));
  }
  parser.close();

  t.deepEqual(
    rows,
    [
      {
        metadata: '{ "nested" : [1, {"escaped":"\\u2603"}] }',
        tags: '[ "alpha" , {"value":2} ]',
        label: 'line\nbreak'
      }
    ],
    'selected nested values remain exact JSON source while strings decode normally'
  );
  t.end();
});

test('FastStreamingJSONParser handles escaped keys and unicode stream strings', t => {
  const json = '{"\\u0066eatures":["\\u2603", "line\\nbreak"],"line\\nbreak":[1]}';
  const output = collectParserOutput(FastStreamingJSONParser, json, 1, ['$.features']);

  t.deepEqual(output.rows, ['☃', 'line\nbreak'], 'escaped string rows are decoded');
  t.deepEqual(output.partialResult, {features: []}, 'partial result preserves escaped key path');
  t.equal(output.jsonpath, '$.features', 'jsonpath matches escaped key');
  t.end();
});

test('FastStreamingJSONParser handles unmatched paths and non-streaming close', t => {
  const json = '  {"empty": {}, "nested": [[], {"value": 1}], "flag": true}';
  const output = collectParserOutput(FastStreamingJSONParser, json, 3, ['$.missing']);

  t.deepEqual(output.rows, [], 'no rows are emitted without a matching path');
  t.deepEqual(output.finalResult, JSON.parse(json), 'complete JSON is available after close');
  t.equal(output.jsonpath, null, 'no streaming jsonpath is selected');
  t.end();
});

test('FastStreamingJSONParser tolerates incomplete trailing JSON', t => {
  const parser = new FastStreamingJSONParser({metadata: true});

  t.deepEqual(parser.write('[1'), [], 'incomplete primitive is held until more data arrives');
  parser.close();
  t.deepEqual(parser.write(''), [], 'closed incomplete input does not emit partial rows');
  t.deepEqual(parser.getPartialResult(), [], 'root streaming metadata is initialized');
  t.end();
});

/**
 * Collects rows and metadata from a streaming parser for comparison.
 */
function collectParserOutput(
  Parser: StreamingParserConstructor,
  json: string,
  chunkSize: number,
  jsonpaths?: string[]
) {
  const parser = new Parser({jsonpaths, metadata: true});
  const rows: unknown[] = [];
  let partialResult: unknown = null;

  for (const chunk of splitIntoChunks(json, chunkSize)) {
    const chunkRows = parser.write(chunk);
    if (chunkRows.length > 0 && partialResult === null) {
      partialResult = parser.getPartialResult();
    }
    rows.push(...chunkRows);
  }

  parser.close();

  return {
    rows,
    partialResult,
    finalResult: parser.getPartialResult(),
    rawJsonPath: parser.getStreamingJsonPath(),
    jsonpath: parser.getStreamingJsonPathAsString()
  };
}

/**
 * Splits a string into equal-sized chunks.
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];

  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }

  return chunks;
}
