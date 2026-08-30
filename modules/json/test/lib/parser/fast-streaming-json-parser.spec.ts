// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
test('FastStreamingJSONParser matches current parser for $.features across chunk sizes', () => {
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
    expect(actual.rows, `rows match at chunk size ${chunkSize}`).toEqual(expected.rows);
    expect(actual.partialResult, `partial result matches at chunk size ${chunkSize}`).toEqual(
      expected.partialResult
    );
    expect(actual.finalResult, `final result matches at chunk size ${chunkSize}`).toEqual(
      expected.finalResult
    );
    expect(actual.jsonpath, `jsonpath matches at chunk size ${chunkSize}`).toBe('$.features');
  }
});
test('Streaming parsers match for nested array rows across chunk sizes', () => {
  for (const {name, Parser} of PARSERS) {
    const output = collectParserOutput(Parser, NESTED_ARRAY_JSON, 1, ['$.data.allData']);
    expect(output.rows.length, `${name} found all rows`).toBe(3);
    expect(output.finalResult, `${name} final metadata result is correct`).toEqual({
      data: {allData: []}
    });
    expect(output.jsonpath, `${name} jsonpath is correct`).toBe('$.data.allData');
  }
});
test('Streaming parsers match for root array chunk boundaries', () => {
  const expected = collectParserOutput(StreamingJSONParser, ROOT_ARRAY_JSON, 2);
  const actual = collectParserOutput(FastStreamingJSONParser, ROOT_ARRAY_JSON, 2);
  expect(actual.rows, 'rows match for root array').toEqual(expected.rows);
  expect(actual.jsonpath, 'jsonpath is root array').toBe('$');
});
test('Streaming parsers match for scalar string array chunk boundaries', () => {
  const expected = collectParserOutput(StreamingJSONParser, STRING_ARRAY_JSON, 1);
  const actual = collectParserOutput(FastStreamingJSONParser, STRING_ARRAY_JSON, 1);
  expect(actual.rows, 'rows match for string array').toEqual(expected.rows);
  expect(actual.jsonpath, 'jsonpath is root array').toBe('$');
});
test('FastStreamingJSONParser handles primitive array rows', () => {
  const output = collectParserOutput(FastStreamingJSONParser, '[1, true, null, -2.5]', 2);
  expect(output.rows, 'primitive rows are emitted').toEqual([1, true, null, -2.5]);
  expect(output.jsonpath, 'jsonpath is root array').toBe('$');
  expect(output.rawJsonPath, 'raw JSONPath object is available').toBeTruthy();
});
test('FastStreamingJSONParser preserves configured raw Utf8 object and array fields', () => {
  const parser = new FastStreamingJSONParser({
    rawJsonUtf8Fields: ['metadata', 'tags']
  });
  const rows: unknown[] = [];
  for (const chunk of splitIntoChunks(RAW_UTF8_ROW_JSON, 1)) {
    rows.push(...parser.write(chunk));
  }
  parser.close();
  expect(
    rows,
    'selected nested values remain exact JSON source while strings decode normally'
  ).toEqual([
    {
      metadata: '{ "nested" : [1, {"escaped":"\\u2603"}] }',
      tags: '[ "alpha" , {"value":2} ]',
      label: 'line\nbreak'
    }
  ]);
});
test('FastStreamingJSONParser handles escaped keys and unicode stream strings', () => {
  const json = '{"\\u0066eatures":["\\u2603", "line\\nbreak"],"line\\nbreak":[1]}';
  const output = collectParserOutput(FastStreamingJSONParser, json, 1, ['$.features']);
  expect(output.rows, 'escaped string rows are decoded').toEqual(['☃', 'line\nbreak']);
  expect(output.partialResult, 'partial result preserves escaped key path').toEqual({features: []});
  expect(output.jsonpath, 'jsonpath matches escaped key').toBe('$.features');
});
test('FastStreamingJSONParser handles unmatched paths and non-streaming close', () => {
  const json = '  {"empty": {}, "nested": [[], {"value": 1}], "flag": true}';
  const output = collectParserOutput(FastStreamingJSONParser, json, 3, ['$.missing']);
  expect(output.rows, 'no rows are emitted without a matching path').toEqual([]);
  expect(output.finalResult, 'complete JSON is available after close').toEqual(JSON.parse(json));
  expect(output.jsonpath, 'no streaming jsonpath is selected').toBe(null);
});
test('FastStreamingJSONParser tolerates incomplete trailing JSON', () => {
  const parser = new FastStreamingJSONParser({metadata: true});
  expect(parser.write('[1'), 'incomplete primitive is held until more data arrives').toEqual([]);
  parser.close();
  expect(parser.write(''), 'closed incomplete input does not emit partial rows').toEqual([]);
  expect(parser.getPartialResult(), 'root streaming metadata is initialized').toEqual([]);
});

test('FastStreamingJSONParser seeks through every JSON value shape before the target', () => {
  const json = JSON.stringify({
    emptyObject: {},
    emptyArray: [],
    text: 'ignored',
    escaped: '\b\f\n\r\t/\\"',
    primitive: false,
    nested: [{value: null}, [1, 2]],
    rows: [{id: 1}, {id: 2}]
  });
  const output = collectParserOutput(FastStreamingJSONParser, json, 1, ['$.rows']);
  expect(output.rows).toEqual([{id: 1}, {id: 2}]);
  expect(output.partialResult).toEqual({
    emptyObject: {},
    emptyArray: [],
    text: 'ignored',
    escaped: '\b\f\n\r\t/\\"',
    primitive: false,
    nested: [{value: null}, [1, 2]],
    rows: []
  });
});

test('FastStreamingJSONParser decodes every escaped key character', () => {
  const escapedKeys = [
    ['quote\\"key', 'quote"key'],
    ['slash\\\\key', 'slash\\key'],
    ['solidus\\/key', 'solidus/key'],
    ['backspace\\bkey', 'backspace\bkey'],
    ['formfeed\\fkey', 'formfeed\fkey'],
    ['newline\\nkey', 'newline\nkey'],
    ['return\\rkey', 'return\rkey'],
    ['tab\\tkey', 'tab\tkey']
  ];
  for (const [encodedKey, decodedKey] of escapedKeys) {
    const output = collectParserOutput(
      FastStreamingJSONParser,
      `{\"${encodedKey}\":0,\"rows\":[1]}`,
      1,
      ['$.rows']
    );
    expect(output.rows, decodedKey).toEqual([1]);
  }
});

test('FastStreamingJSONParser keeps raw-field rewriting conservative for non-object rows', () => {
  const parser = new FastStreamingJSONParser({rawJsonUtf8Fields: ['raw']});
  const rows = parser.write('[1,"two",null,{"raw":3},{"other":{"x":1}}]');
  parser.close();
  expect(rows).toEqual([1, 'two', null, {raw: 3}, {other: {x: 1}}]);
});

test('FastStreamingJSONParser safely emits syntactically complete complex rows only', () => {
  const parser = new FastStreamingJSONParser({metadata: false});
  expect(parser.write('[[{"text":"} ] \\\" \\u2603"}],')).toEqual([[{text: '} ] " ☃'}]]);
  expect(parser.write('{"nested":[1,2]}] trailing text')).toEqual([{nested: [1, 2]}]);
  parser.close();
  expect(parser.getPartialResult()).toBeNull();
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
