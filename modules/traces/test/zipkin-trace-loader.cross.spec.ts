// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, parse, parseInBatches, parseSync} from '@loaders.gl/core';
import {describe, expect, it} from 'vitest';

import {
  ZipkinTraceLoader,
  ZipkinTraceWriter,
  OtlpTraceJsonLoader,
  type OtlpTrace,
  type OtlpTraceBatch,
  type ZipkinSpan
} from '../src';
import {ZipkinTraceLoaderWithParser} from '../src/zipkin-trace-loader';
import zipkinTraceFixture from './data/zipkin/trace.json' with {type: 'json'};

/** Encodes one JSON value as UTF-8 bytes. */
function encodeJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

describe('Zipkin trace loader and writer', () => {
  it('loads the upstream-derived Zipkin v2 fixture into normalized Arrow tables', async () => {
    const trace = (await parse(encodeJson(zipkinTraceFixture), ZipkinTraceLoader)) as OtlpTrace;

    expect(trace.resources.numRows).toBe(1);
    expect(trace.scopes.getChild('name')?.get(0)).toBe('zipkin');
    expect(trace.spans.getChild('name')?.get(0)).toBe('get /api');
    expect(trace.spans.getChild('kind')?.get(0)).toBe(2);
    expect(trace.spans.getChild('start_time_unix_nano')?.get(0)).toBe(1556604172355737000n);
    expect(trace.events.getChild('name')?.get(0)).toBe('request received');
    expect(trace.resources.getChild('attributes_json')?.get(0)).toContain('backend');
    expect(trace.spans.getChild('attributes_json')?.get(0)).toContain('172.19.0.2');
  });

  it('maps nested trace lists, 128-bit IDs, compatibility fields, and error status', async () => {
    const span: ZipkinSpan = {
      ...zipkinTraceFixture[0],
      traceId: 'aaaaaaaaaaaaaaaa5af7183fb1d4cf5f',
      id: '1111111111111111',
      parentId: undefined,
      kind: 'CLIENT',
      timestamp: '1556604172355737',
      duration: '1431',
      debug: true,
      shared: false,
      tags: {error: 'timeout'}
    };
    const trace = (await parse(encodeJson([[span]]), ZipkinTraceLoader)) as OtlpTrace;

    expect(trace.spans.getChild('kind')?.get(0)).toBe(3);
    expect(trace.spans.getChild('status_code')?.get(0)).toBe(2);
    expect(trace.spans.getChild('attributes_json')?.get(0)).toContain('zipkin.debug');
    expect(trace.spans.getChild('trace_id')?.get(0)).toEqual(
      Uint8Array.from(span.traceId.match(/../g) ?? [], value => Number.parseInt(value, 16))
    );
  });

  it('round-trips through span-array and trace-list writer shapes', async () => {
    const source = (await parse(encodeJson(zipkinTraceFixture), ZipkinTraceLoader)) as OtlpTrace;
    const spanArray = JSON.parse(
      new TextDecoder().decode(
        encodeSync(source, ZipkinTraceWriter, {zipkinTrace: {shape: 'spans', space: 2}})
      )
    ) as ZipkinSpan[];
    const traceList = JSON.parse(
      new TextDecoder().decode(
        encodeSync(source, ZipkinTraceWriter, {zipkinTrace: {shape: 'traces'}})
      )
    ) as ZipkinSpan[][];
    const roundTrip = (await parse(encodeJson(spanArray), ZipkinTraceLoader)) as OtlpTrace;

    expect(spanArray[0]).toMatchObject({
      traceId: '5af7183fb1d4cf5f',
      id: '352bff9a74ca9ad2',
      parentId: '6b221d5bc9e6496c',
      name: 'get /api',
      kind: 'SERVER',
      timestamp: 1556604172355737,
      duration: 1431
    });
    expect(spanArray[0].localEndpoint?.serviceName).toBe('backend');
    expect(spanArray[0].remoteEndpoint?.ipv4).toBe('172.19.0.2');
    expect(traceList).toHaveLength(1);
    expect(roundTrip.spans.getChild('name')?.get(0)).toBe('get /api');
  });

  it('supports the parser subpath and bounded public batch parsing', async () => {
    const bytes = encodeJson(zipkinTraceFixture);
    const syncTrace = parseSync(bytes, ZipkinTraceLoaderWithParser) as OtlpTrace;
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const asyncTrace = (await ZipkinTraceLoaderWithParser.parse(arrayBuffer)) as OtlpTrace;
    const textTrace = (await ZipkinTraceLoaderWithParser.parseText(
      JSON.stringify(zipkinTraceFixture)
    )) as OtlpTrace;
    const textSyncTrace = ZipkinTraceLoaderWithParser.parseTextSync(
      JSON.stringify(zipkinTraceFixture)
    ) as OtlpTrace;
    const iterator = await parseInBatches(
      [bytes.subarray(0, 13), bytes.subarray(13)],
      ZipkinTraceLoader,
      {zipkinTrace: {batchSize: 1}}
    );
    const batches: OtlpTraceBatch[] = [];
    for await (const batch of iterator) {
      batches.push(batch as OtlpTraceBatch);
    }

    expect(syncTrace.spans.numRows).toBe(1);
    expect(asyncTrace.spans.numRows).toBe(1);
    expect(textTrace.spans.numRows).toBe(1);
    expect(textSyncTrace.spans.numRows).toBe(1);
    expect(batches.map(batch => batch.table)).toContain('spans');
    expect(batches.every(batch => batch.data.numRows <= 1)).toBe(true);
  });

  it('supports every public writer entrypoint', async () => {
    const source = (await parse(encodeJson(zipkinTraceFixture), ZipkinTraceLoader)) as OtlpTrace;

    expect((await ZipkinTraceWriter.encode(source)).byteLength).toBeGreaterThan(0);
    expect(await ZipkinTraceWriter.encodeText(source)).toContain('"traceId"');
    expect(ZipkinTraceWriter.encodeTextSync(source)).toContain('"traceId"');
  });

  it('accepts JSON Lines and rejects invalid shapes and scalar fields', async () => {
    const line = JSON.stringify(zipkinTraceFixture[0]);
    const trace = (await parse(
      new TextEncoder().encode(`${line}\n${line}\n`),
      ZipkinTraceLoader
    )) as OtlpTrace;
    expect(trace.spans.numRows).toBe(2);

    expect(() => parseSync(encodeJson({unexpected: true}), ZipkinTraceLoaderWithParser)).toThrow(
      'span, span array, or array of traces'
    );
    expect(() =>
      parseSync(
        encodeJson([{...zipkinTraceFixture[0], traceId: 'invalid'}]),
        ZipkinTraceLoaderWithParser
      )
    ).toThrow('traceId');
    expect(() =>
      parseSync(
        encodeJson([{...zipkinTraceFixture[0], duration: '-1'}]),
        ZipkinTraceLoaderWithParser
      )
    ).toThrow('unsigned integers');
  });

  it('emits a JSON Lines document before requesting the next source chunk', async () => {
    const line = JSON.stringify(zipkinTraceFixture[0]);
    let secondChunkRequested = false;
    async function* createStream(): AsyncIterable<Uint8Array> {
      yield new TextEncoder().encode(`\r\n${line}\r\n`);
      secondChunkRequested = true;
      yield new TextEncoder().encode(`${line}\n`);
    }
    const batches = await parseInBatches(createStream(), ZipkinTraceLoader);
    const iterator = batches[Symbol.asyncIterator]();
    const firstBatch = await iterator.next();

    expect(firstBatch.value.table).toBe('resources');
    expect(secondChunkRequested).toBe(false);
    await iterator.return?.();
  });

  it('rejects a malformed JSON Lines document after emitting a valid document', async () => {
    const line = JSON.stringify(zipkinTraceFixture[0]);
    const batches = await parseInBatches(
      [new TextEncoder().encode(`${line}\n{"broken":\n`)],
      ZipkinTraceLoader
    );

    await expect(async () => {
      for await (const _batch of batches) {
        // The valid first document emits before the malformed second document throws.
      }
    }).rejects.toThrow();
  });

  it('streams pretty JSON through the whole-document fallback', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(zipkinTraceFixture, null, 2));
    const batches = await parseInBatches(
      [bytes.subarray(0, 40), bytes.subarray(40)],
      ZipkinTraceLoader
    );
    const tables: string[] = [];
    for await (const batch of batches) {
      tables.push((batch as OtlpTraceBatch).table);
    }
    expect(tables).toContain('spans');
  });

  it('round-trips IPv6, remote services, compatibility booleans, and absent fields', async () => {
    const spans: ZipkinSpan[] = [
      {
        traceId: 'aaaaaaaaaaaaaaaa',
        id: 'bbbbbbbbbbbbbbbb',
        kind: 'PRODUCER',
        localEndpoint: {serviceName: 'events', ipv6: '2001:db8::1'},
        remoteEndpoint: {serviceName: 'broker', ipv6: '2001:db8::2'},
        debug: true,
        shared: false
      },
      {
        traceId: 'cccccccccccccccc',
        id: 'dddddddddddddddd',
        kind: 'CONSUMER'
      }
    ];
    const trace = (await parse(encodeJson(spans), ZipkinTraceLoader)) as OtlpTrace;
    const output = JSON.parse(ZipkinTraceWriter.encodeTextSync(trace)) as ZipkinSpan[];

    expect(output[0]).toMatchObject({
      kind: 'PRODUCER',
      localEndpoint: {serviceName: 'events', ipv6: '2001:db8::1'},
      remoteEndpoint: {serviceName: 'broker', ipv6: '2001:db8::2'},
      debug: true,
      shared: false,
      timestamp: 0,
      duration: 0
    });
    expect(output[1]).not.toHaveProperty('localEndpoint');
  });

  it('converts OTLP error status and scalar attributes into Zipkin tags', async () => {
    const otlp = {
      resourceSpans: [
        {
          resource: {attributes: [{key: 'server.port', value: {intValue: '8080'}}]},
          scopeSpans: [
            {
              scope: {name: 'test'},
              spans: [
                {
                  traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                  spanId: 'bbbbbbbbbbbbbbbb',
                  name: 'request',
                  startTimeUnixNano: '100000',
                  endTimeUnixNano: '110000',
                  attributes: [
                    {key: 'enabled', value: {boolValue: true}},
                    {key: 'count', value: {intValue: '2'}},
                    {key: 'ratio', value: {doubleValue: 0.5}},
                    {key: 'payload', value: {bytesValue: 'AQI='}}
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
    const output = JSON.parse(ZipkinTraceWriter.encodeTextSync(trace)) as ZipkinSpan[];

    expect(output[0].tags).toMatchObject({
      enabled: 'true',
      count: '2',
      ratio: '0.5',
      payload: 'AQI=',
      error: 'failed'
    });
    expect(output[0]).not.toHaveProperty('kind');
  });
});
