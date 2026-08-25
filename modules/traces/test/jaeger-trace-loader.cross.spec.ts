// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, parse, parseInBatches, parseSync} from '@loaders.gl/core';
import {describe, expect, it} from 'vitest';

import {
  JaegerTraceLoader,
  JaegerTraceWriter,
  OtlpTraceJsonLoader,
  type JaegerQueryResponse,
  type OtlpTrace,
  type OtlpTraceBatch
} from '../src';
import {JaegerTraceLoaderWithParser} from '../src/jaeger-trace-loader';
import officialJaegerTrace from './data/jaeger/trace.json' with {type: 'json'};

const TRACE_ID = '2be38093ead7a083';

/** Encodes one JSON value as UTF-8 bytes. */
function encodeJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

describe('Jaeger trace loader and writer', () => {
  it('loads the upstream Jaeger span-array fixture into normalized Arrow tables', async () => {
    const trace = (await parse(encodeJson(officialJaegerTrace), JaegerTraceLoader)) as OtlpTrace;

    expect(trace.resources.numRows).toBe(2);
    expect(trace.scopes.numRows).toBe(2);
    expect(trace.spans.numRows).toBe(2);
    expect(trace.spans.getChild('name')?.toArray()).toEqual([
      'a071653098f9250d',
      '471418097747d04a'
    ]);
    expect(trace.spans.getChild('kind')?.toArray()).toEqual(Int8Array.from([2, 3]));
    expect(trace.spans.getChild('status_code')?.toArray()).toEqual(Int8Array.from([0, 2]));
    expect(trace.spans.getChild('trace_id')?.get(0)).toEqual(
      Uint8Array.from(`0000000000000000${TRACE_ID}`.match(/../g) ?? [], value =>
        Number.parseInt(value, 16)
      )
    );
  });

  it('maps query processes, typed tags, logs, parents, and follows-from references', async () => {
    const document = {
      data: [
        {
          traceID: TRACE_ID,
          processes: {
            p1: {
              serviceName: 'checkout',
              tags: [{key: 'deployment.environment', type: 'string', value: 'test'}]
            }
          },
          spans: [
            {
              traceID: TRACE_ID,
              spanID: '1111111111111111',
              operationName: 'request',
              processID: 'p1',
              startTime: 100,
              duration: 25,
              flags: 1,
              references: [
                {refType: 'CHILD_OF', traceID: TRACE_ID, spanID: '2222222222222222'},
                {
                  refType: 'FOLLOWS_FROM',
                  traceID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                  spanID: 'bbbbbbbbbbbbbbbb'
                }
              ],
              tags: [
                {key: 'attempt', type: 'int64', value: '3'},
                {key: 'sampled', type: 'bool', value: true},
                {key: 'ratio', type: 'float64', value: 0.5}
              ],
              logs: [
                {
                  timestamp: 110,
                  fields: [
                    {key: 'event', type: 'string', value: 'retry'},
                    {key: 'count', type: 'int64', value: '2'}
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
    const trace = (await parse(encodeJson(document), JaegerTraceLoader)) as OtlpTrace;

    expect(trace.resources.getChild('attributes_json')?.get(0)).toContain('checkout');
    expect(trace.spans.getChild('parent_span_id')?.get(0)).toEqual(
      Uint8Array.from([0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22])
    );
    expect(trace.spans.getChild('start_time_unix_nano')?.get(0)).toBe(100000n);
    expect(trace.events.getChild('name')?.get(0)).toBe('retry');
    expect(trace.links.numRows).toBe(1);
    expect(trace.links.getChild('attributes_json')?.get(0)).toContain('FOLLOWS_FROM');
  });

  it('round-trips normalized traces through Query API and raw span-array output', async () => {
    const source = (await parse(encodeJson(officialJaegerTrace), JaegerTraceLoader)) as OtlpTrace;
    const queryJson = JSON.parse(
      new TextDecoder().decode(
        encodeSync(source, JaegerTraceWriter, {jaegerTrace: {shape: 'query', space: 2}})
      )
    ) as JaegerQueryResponse;
    const spansJson = JSON.parse(
      new TextDecoder().decode(
        encodeSync(source, JaegerTraceWriter, {jaegerTrace: {shape: 'spans'}})
      )
    );
    const roundTrip = (await parse(encodeJson(queryJson), JaegerTraceLoader)) as OtlpTrace;

    expect(queryJson.data).toHaveLength(1);
    expect(queryJson.data[0].spans).toHaveLength(2);
    expect(queryJson.data[0].spans[0]).toMatchObject({
      traceID: TRACE_ID,
      spanID: '7606ddfe69932d34',
      operationName: 'a071653098f9250d',
      startTime: 1605223981761425,
      duration: 267037
    });
    expect(spansJson[0].process.serviceName).toBe('16af988c443cff37');
    expect(roundTrip.spans.getChild('name')?.toArray()).toEqual(
      source.spans.getChild('name')?.toArray()
    );
  });

  it('supports parser subpath and bounded public batched parsing', async () => {
    const bytes = encodeJson(officialJaegerTrace);
    const syncTrace = parseSync(bytes, JaegerTraceLoaderWithParser) as OtlpTrace;
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const asyncTrace = (await JaegerTraceLoaderWithParser.parse(arrayBuffer)) as OtlpTrace;
    const textTrace = (await JaegerTraceLoaderWithParser.parseText(
      JSON.stringify(officialJaegerTrace)
    )) as OtlpTrace;
    const textSyncTrace = JaegerTraceLoaderWithParser.parseTextSync(
      JSON.stringify(officialJaegerTrace)
    ) as OtlpTrace;
    const batchIterator = await parseInBatches(
      [bytes.subarray(0, 19), bytes.subarray(19)],
      JaegerTraceLoader,
      {jaegerTrace: {batchSize: 1}}
    );
    const batches: OtlpTraceBatch[] = [];
    for await (const batch of batchIterator) {
      batches.push(batch as OtlpTraceBatch);
    }

    expect(syncTrace.spans.numRows).toBe(2);
    expect(asyncTrace.spans.numRows).toBe(2);
    expect(textTrace.spans.numRows).toBe(2);
    expect(textSyncTrace.spans.numRows).toBe(2);
    expect(batches.filter(batch => batch.table === 'spans')).toHaveLength(2);
    expect(batches.every(batch => batch.data.numRows <= 1)).toBe(true);
  });

  it('supports every public writer entrypoint', async () => {
    const source = (await parse(encodeJson(officialJaegerTrace), JaegerTraceLoader)) as OtlpTrace;

    expect((await JaegerTraceWriter.encode(source)).byteLength).toBeGreaterThan(0);
    expect(await JaegerTraceWriter.encodeText(source)).toContain('"data"');
    expect(JaegerTraceWriter.encodeTextSync(source)).toContain('"data"');
  });

  it('accepts newline-delimited Jaeger trace objects', async () => {
    const first = {
      traceID: TRACE_ID,
      spans: [officialJaegerTrace[0]],
      processes: {}
    };
    const second = {
      traceID: TRACE_ID,
      spans: [officialJaegerTrace[1]],
      processes: {}
    };
    const trace = (await parse(
      new TextEncoder().encode(`${JSON.stringify(first)}\n${JSON.stringify(second)}\n`),
      JaegerTraceLoader
    )) as OtlpTrace;

    expect(trace.spans.numRows).toBe(2);
  });

  it('streams newline-delimited traces before the source completes', async () => {
    const first = JSON.stringify({
      traceID: TRACE_ID,
      spans: [officialJaegerTrace[0]],
      processes: {}
    });
    const second = JSON.stringify({
      traceID: TRACE_ID,
      spans: [officialJaegerTrace[1]],
      processes: {}
    });
    let secondChunkRequested = false;
    async function* createStream(): AsyncIterable<Uint8Array> {
      yield new TextEncoder().encode(`\r\n${first}\r\n`);
      secondChunkRequested = true;
      yield new TextEncoder().encode(`${second}\n`);
    }
    const batches = await parseInBatches(createStream(), JaegerTraceLoader);
    const iterator = batches[Symbol.asyncIterator]();
    const firstBatch = await iterator.next();

    expect(firstBatch.value.table).toBe('resources');
    expect(secondChunkRequested).toBe(false);
    await iterator.return?.();
  });

  it('rejects a malformed JSON Lines document after emitting a valid document', async () => {
    const first = JSON.stringify({
      traceID: TRACE_ID,
      spans: [officialJaegerTrace[0]],
      processes: {}
    });
    const batches = await parseInBatches(
      [new TextEncoder().encode(`${first}\n{"broken":\n`)],
      JaegerTraceLoader
    );

    await expect(async () => {
      for await (const _batch of batches) {
        // The valid first document emits before the malformed second document throws.
      }
    }).rejects.toThrow();
  });

  it('streams pretty JSON through the whole-document fallback', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(officialJaegerTrace, null, 2));
    const batches = await parseInBatches(
      [bytes.subarray(0, 40), bytes.subarray(40)],
      JaegerTraceLoader
    );
    const tables: string[] = [];
    for await (const batch of batches) {
      tables.push((batch as OtlpTraceBatch).table);
    }
    expect(tables).toContain('spans');
  });

  it('preserves scalar tag types, link kinds, and unnamed logs through the writer', async () => {
    const document = {
      traceID: TRACE_ID,
      spans: [
        {
          traceID: TRACE_ID,
          spanID: '1111111111111111',
          operationName: 'typed',
          startTime: 100,
          duration: 10,
          references: [
            {
              refType: 'FOLLOWS_FROM',
              traceID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              spanID: 'bbbbbbbbbbbbbbbb'
            }
          ],
          tags: [
            {key: 'enabled', type: 'bool', value: 'false'},
            {key: 'count', type: 'int64', value: '7'},
            {key: 'ratio', type: 'float64', value: 0.25},
            {key: 'payload', type: 'binary', value: 'AQI='}
          ],
          logs: [{timestamp: 105, fields: [{key: 'message', type: 'string', value: 'hello'}]}],
          process: {serviceName: '', tags: []}
        }
      ]
    };
    const trace = (await parse(encodeJson(document), JaegerTraceLoader)) as OtlpTrace;
    const output = JSON.parse(JaegerTraceWriter.encodeTextSync(trace)) as JaegerQueryResponse;
    const span = output.data[0].spans[0];

    expect(span.tags?.map(tag => tag.type)).toEqual(['bool', 'int64', 'float64', 'binary']);
    expect(span.logs?.[0].fields[0]).toMatchObject({key: 'event', value: 'log'});
    expect(span.references?.[0].refType).toBe('FOLLOWS_FROM');
  });

  it('writes OTLP-only kinds, links, status, and missing service names predictably', async () => {
    const otlp = {
      resourceSpans: [
        {
          resource: {attributes: []},
          scopeSpans: [
            {
              scope: {name: 'test'},
              spans: [
                {
                  traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                  spanId: 'bbbbbbbbbbbbbbbb',
                  name: 'producer',
                  kind: 4,
                  startTimeUnixNano: '100000',
                  endTimeUnixNano: '110000',
                  links: [
                    {
                      traceId: 'cccccccccccccccccccccccccccccccc',
                      spanId: 'dddddddddddddddd'
                    }
                  ],
                  status: {code: 2, message: 'failed'}
                }
              ]
            }
          ]
        }
      ]
    };
    const trace = (await parse(encodeJson(otlp), OtlpTraceJsonLoader)) as OtlpTrace;
    const output = JSON.parse(JaegerTraceWriter.encodeTextSync(trace)) as JaegerQueryResponse;
    const span = output.data[0].spans[0];

    expect(output.data[0].processes?.p1.serviceName).toBe('');
    expect(span.tags).toEqual(
      expect.arrayContaining([
        {key: 'span.kind', type: 'string', value: 'producer'},
        {key: 'error', type: 'bool', value: true}
      ])
    );
    expect(span.references?.[0].refType).toBe('FOLLOWS_FROM');
  });

  it('rejects malformed shapes, identifiers, and unsafe timestamps', () => {
    expect(() => parseSync(encodeJson({unexpected: true}), JaegerTraceLoaderWithParser)).toThrow(
      'query response, trace object, or span array'
    );
    expect(() =>
      parseSync(
        encodeJson([{...officialJaegerTrace[0], spanID: 'not-hex'}]),
        JaegerTraceLoaderWithParser
      )
    ).toThrow('spanID');
    expect(() =>
      parseSync(
        encodeJson([{...officialJaegerTrace[0], startTime: Number.MAX_SAFE_INTEGER + 1}]),
        JaegerTraceLoaderWithParser
      )
    ).toThrow('safe integers');
  });
});
