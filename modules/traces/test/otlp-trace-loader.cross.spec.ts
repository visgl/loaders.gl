// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  encode,
  encodeSync,
  encodeText,
  encodeTextSync,
  parse,
  parseInBatches,
  parseSync
} from '@loaders.gl/core';
import {describe, expect, it} from 'vitest';

import officialOtlpTrace from './data/otlp/trace.json' with {type: 'json'};
import {OtlpTraceJsonLoaderWithParser} from '../src/otlp-trace-json-loader';
import {OtlpTraceLoaderWithParser} from '../src/otlp-trace-loader';

import {
  OtlpTraceJsonLoader,
  OtlpTraceJsonWriter,
  OtlpTraceLoader,
  OtlpTraceWriter,
  type OtlpTrace,
  type OtlpTraceBatch
} from '../src';

const TRACE_ID = '5b8efff798038103d269b633813fc60c';
const SPAN_ID = 'eee19b7ec3c1b174';
const PARENT_SPAN_ID = 'eee19b7ec3c1b173';
const LINK_TRACE_ID = '11111111111111111111111111111111';
const LINK_SPAN_ID = '2222222222222222';

/** Builds one representative OTLP protobuf-JSON trace. */
function createOtlpJsonDocument(spanName = 'server request'): Record<string, unknown> {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {key: 'service.name', value: {stringValue: 'api'}},
            {key: 'replicas', value: {intValue: '3'}},
            {key: 'healthy', value: {boolValue: true}},
            {
              key: 'nested',
              value: {
                kvlistValue: {values: [{key: 'ratio', value: {doubleValue: 0.5}}]}
              }
            }
          ],
          droppedAttributesCount: 1
        },
        schemaUrl: 'https://opentelemetry.io/schemas/1.27.0',
        scopeSpans: [
          {
            scope: {
              name: 'example.instrumentation',
              version: '1.2.3',
              attributes: [{key: 'scope.attribute', value: {stringValue: 'value'}}]
            },
            schemaUrl: 'https://opentelemetry.io/schemas/1.28.0',
            spans: [
              {
                traceId: TRACE_ID,
                spanId: SPAN_ID,
                parentSpanId: PARENT_SPAN_ID,
                traceState: 'vendor=value',
                flags: 257,
                name: spanName,
                kind: 2,
                startTimeUnixNano: '1544712660000000000',
                endTimeUnixNano: '1544712661000000000',
                attributes: [{key: 'http.request.method', value: {stringValue: 'GET'}}],
                droppedAttributesCount: 2,
                events: [
                  {
                    timeUnixNano: '1544712660500000000',
                    name: 'exception',
                    attributes: [{key: 'exception.type', value: {stringValue: 'Error'}}],
                    droppedAttributesCount: 3
                  },
                  {
                    timeUnixNano: '1544712660750000000',
                    name: 'retry'
                  }
                ],
                droppedEventsCount: 4,
                links: [
                  {
                    traceId: LINK_TRACE_ID,
                    spanId: LINK_SPAN_ID,
                    traceState: 'linked=value',
                    flags: 1,
                    attributes: [{key: 'link.type', value: {stringValue: 'batch'}}],
                    droppedAttributesCount: 5
                  },
                  {
                    traceId: '33333333333333333333333333333333',
                    spanId: '4444444444444444'
                  }
                ],
                droppedLinksCount: 6,
                status: {message: 'failed', code: 2}
              }
            ]
          }
        ]
      }
    ]
  };
}

/** Encodes one JSON value as a UTF-8 ArrayBuffer. */
function encodeJson(value: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Collects every batch from one public batched parse call. */
async function collectBatches(batches: AsyncIterable<unknown>): Promise<unknown[]> {
  const results: unknown[] = [];
  for await (const batch of batches) {
    results.push(batch);
  }
  return results;
}

/** Replaces one Arrow column while preserving the other public result columns. */
function replaceColumn(table: arrow.Table, columnName: string, values: unknown[]): arrow.Table {
  const columns: Record<string, arrow.Vector> = {};
  for (const field of table.schema.fields) {
    columns[field.name] = arrow.vectorFromArray(
      field.name === columnName ? values : Array.from(table.getChild(field.name) ?? []),
      field.type
    );
  }
  return new arrow.Table(table.schema, columns);
}

describe('OTLP trace loaders and writers', () => {
  it('loads the official OpenTelemetry OTLP JSON trace example', async () => {
    const trace = (await parse(encodeJson(officialOtlpTrace), OtlpTraceJsonLoader)) as OtlpTrace;

    expect(trace.resources.getChild('attributes_json')?.get(0)).toContain('my.service');
    expect(trace.scopes.getChild('name')?.get(0)).toBe('my.library');
    expect(trace.spans.getChild('name')?.get(0)).toBe("I'm a server span");
    expect(trace.spans.getChild('kind')?.get(0)).toBe(2);
  });

  it('normalizes official OTLP JSON semantics into analytical Arrow tables', async () => {
    const trace = (await parse(
      encodeJson(createOtlpJsonDocument()),
      OtlpTraceJsonLoader
    )) as OtlpTrace;

    expect(trace.resources.numRows).toBe(1);
    expect(trace.scopes.numRows).toBe(1);
    expect(trace.spans.numRows).toBe(1);
    expect(trace.events.numRows).toBe(2);
    expect(trace.links.numRows).toBe(2);
    expect(trace.spans.getChild('name')?.get(0)).toBe('server request');
    expect(trace.spans.getChild('start_time_unix_nano')?.get(0)).toBe(1544712660000000000n);
    expect(trace.spans.getChild('trace_id')?.get(0)).toEqual(
      Uint8Array.from(TRACE_ID.match(/../g) ?? [], value => Number.parseInt(value, 16))
    );
    expect(JSON.parse(trace.resources.getChild('attributes_json')?.get(0) as string)).toHaveLength(
      4
    );
  });

  it('round-trips OTLP protobuf and standards-compliant OTLP JSON', async () => {
    const source = (await parse(
      encodeJson(createOtlpJsonDocument()),
      OtlpTraceJsonLoader
    )) as OtlpTrace;
    const protobuf = encodeSync(source, OtlpTraceWriter);
    const decoded = (await parse(protobuf, OtlpTraceLoader)) as OtlpTrace;
    const jsonBytes = encodeSync(decoded, OtlpTraceJsonWriter, {
      otlpTraceJson: {space: 2}
    });
    const json = JSON.parse(new TextDecoder().decode(jsonBytes));

    expect(decoded.spans.getChild('name')?.get(0)).toBe('server request');
    expect(decoded.events.getChild('name')?.get(0)).toBe('exception');
    expect(decoded.links.getChild('trace_state')?.get(0)).toBe('linked=value');
    expect(json.resourceSpans[0].scopeSpans[0].spans[0]).toMatchObject({
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      parentSpanId: PARENT_SPAN_ID,
      kind: 2,
      status: {message: 'failed', code: 2}
    });
  });

  it('supports public sync, async, binary, and text entrypoints', async () => {
    const jsonText = JSON.stringify(officialOtlpTrace);
    const jsonBuffer = encodeJson(officialOtlpTrace);
    const bytesAsync = (await OtlpTraceJsonLoaderWithParser.parse?.(jsonBuffer)) as OtlpTrace;
    const bytesSync = OtlpTraceJsonLoaderWithParser.parseSync?.(jsonBuffer) as OtlpTrace;
    const textSync = OtlpTraceJsonLoaderWithParser.parseTextSync?.(jsonText) as OtlpTrace;
    const textAsync = (await OtlpTraceJsonLoaderWithParser.parseText?.(jsonText)) as OtlpTrace;
    const binarySync = parseSync(jsonBuffer, OtlpTraceJsonLoaderWithParser) as OtlpTrace;
    const protobuf = await encode(binarySync, OtlpTraceWriter);
    const protobufSync = parseSync(protobuf, OtlpTraceLoaderWithParser) as OtlpTrace;
    const jsonBytes = await OtlpTraceJsonWriter.encode?.(protobufSync);
    const protobufBytes = await OtlpTraceWriter.encode?.(protobufSync);
    const jsonTextAsync = await encodeText(protobufSync, OtlpTraceJsonWriter);
    const jsonTextSync = encodeTextSync(protobufSync, OtlpTraceJsonWriter);

    expect(bytesAsync.spans.numRows).toBe(1);
    expect(bytesSync.spans.numRows).toBe(1);
    expect(textSync.spans.numRows).toBe(1);
    expect(textAsync.spans.numRows).toBe(1);
    expect(protobufSync.spans.numRows).toBe(1);
    expect(jsonBytes?.byteLength).toBeGreaterThan(0);
    expect(protobufBytes?.byteLength).toBeGreaterThan(0);
    expect(JSON.parse(jsonTextAsync).resourceSpans).toHaveLength(1);
    expect(JSON.parse(jsonTextSync).resourceSpans).toHaveLength(1);
  });

  it('loads JSON Lines and emits tagged, bounded Arrow batches', async () => {
    const jsonLines = `\n${JSON.stringify(createOtlpJsonDocument('first'))}\n${JSON.stringify(
      createOtlpJsonDocument('second')
    )}\n`;
    const bytes = new TextEncoder().encode(jsonLines);
    const batches = await parseInBatches(
      [bytes.subarray(0, 17), bytes.subarray(17)],
      OtlpTraceJsonLoader,
      {otlpTrace: {batchSize: 1}}
    );
    const results: OtlpTraceBatch[] = [];
    for await (const batch of batches) {
      results.push(batch as OtlpTraceBatch);
    }

    expect(results.filter(batch => batch.table === 'resources')).toHaveLength(2);
    expect(results.filter(batch => batch.table === 'spans')).toHaveLength(2);
    expect(results.every(batch => batch.data.numRows <= 1)).toBe(true);
    expect(
      results
        .filter(batch => batch.table === 'resources')
        .map(batch => batch.data.getChild('resource_id')?.get(0))
    ).toEqual([0, 1]);
    expect(
      results
        .filter(batch => batch.table === 'scopes')
        .map(batch => batch.data.getChild('scope_id')?.get(0))
    ).toEqual([0, 1]);
  });

  it('handles pretty JSON and UTF-8 code points split across input chunks', async () => {
    const document = createOtlpJsonDocument('request ☃');
    const bytes = new TextEncoder().encode(JSON.stringify(document, null, 2));
    const snowmanStart = bytes.findIndex(
      (value, index) => value === 0xe2 && bytes[index + 1] === 0x98
    );
    const batches = await parseInBatches(
      [bytes.subarray(0, snowmanStart + 1), bytes.subarray(snowmanStart + 1)],
      OtlpTraceJsonLoader
    );
    const spanNames: string[] = [];
    for await (const batch of batches) {
      const result = batch as OtlpTraceBatch;
      if (result.table === 'spans') {
        spanNames.push(result.data.getChild('name')?.get(0) as string);
      }
    }

    expect(spanNames).toEqual(['request ☃']);
  });

  it('handles compact final JSON, empty streams, and malformed later JSON Lines', async () => {
    const compactBytes = new TextEncoder().encode(JSON.stringify(createOtlpJsonDocument('final')));
    const compactBatches = await parseInBatches([compactBytes.buffer], OtlpTraceJsonLoader, {
      otlpTrace: {batchSize: Number.NaN}
    });
    const emptyBatches = await parseInBatches([], OtlpTraceJsonLoader);
    const malformedLines = new TextEncoder().encode(
      `${JSON.stringify(createOtlpJsonDocument())}\n{"resourceSpans":\n`
    );
    const malformedBatches = await parseInBatches([malformedLines], OtlpTraceJsonLoader);

    expect(await collectBatches(compactBatches)).not.toHaveLength(0);
    expect(await collectBatches(emptyBatches)).toEqual([]);
    await expect(collectBatches(malformedBatches)).rejects.toThrow();
  });

  it('returns schema-bearing empty tables and rejects malformed JSON', async () => {
    const trace = (await parse(encodeJson({resourceSpans: []}), OtlpTraceJsonLoader)) as OtlpTrace;

    expect(trace.resources.numRows).toBe(0);
    expect(trace.resources.schema.fields.map(field => field.name)).toContain('resource_id');
    await expect(parse(encodeJson({resourceSpans: '['}), OtlpTraceJsonLoader)).rejects.toThrow();
    await expect(
      parse(
        encodeJson({resourceSpans: [{scopeSpans: [{spans: [{traceId: 'xyz'}]}]}]}),
        OtlpTraceJsonLoader
      )
    ).rejects.toThrow(/hexadecimal/);
  });

  it('validates Arrow relationships and required writer values', async () => {
    const trace = (await parse(
      encodeJson(createOtlpJsonDocument()),
      OtlpTraceJsonLoader
    )) as OtlpTrace;
    const invalidAttributes = {
      ...trace,
      resources: replaceColumn(trace.resources, 'attributes_json', ['{}'])
    } as OtlpTrace;
    const unknownResource = {
      ...trace,
      scopes: replaceColumn(trace.scopes, 'resource_id', [99])
    } as OtlpTrace;
    const unknownScope = {
      ...trace,
      spans: replaceColumn(trace.spans, 'scope_id', [99])
    } as OtlpTrace;
    const missingNumber = {
      ...trace,
      spans: replaceColumn(trace.spans, 'flags', [null])
    } as OtlpTrace;
    const missingTimestamp = {
      ...trace,
      spans: replaceColumn(trace.spans, 'start_time_unix_nano', [null])
    } as OtlpTrace;
    const missingString = {
      ...trace,
      spans: replaceColumn(trace.spans, 'name', [null])
    } as OtlpTrace;
    const unknownEventSpan = {
      ...trace,
      events: replaceColumn(trace.events, 'span_id', [new Uint8Array(8), new Uint8Array(8)])
    } as OtlpTrace;

    for (const invalidTrace of [
      invalidAttributes,
      unknownResource,
      unknownScope,
      missingNumber,
      missingTimestamp,
      missingString,
      unknownEventSpan
    ]) {
      expect(() => encodeSync(invalidTrace, OtlpTraceWriter)).toThrow();
    }

    const rootDocument = createOtlpJsonDocument() as {
      resourceSpans: Array<{scopeSpans: Array<{spans: Array<Record<string, unknown>>}>}>;
    };
    delete rootDocument.resourceSpans[0].scopeSpans[0].spans[0].parentSpanId;
    const rootTrace = (await parse(encodeJson(rootDocument), OtlpTraceJsonLoader)) as OtlpTrace;

    expect(encodeSync(rootTrace, OtlpTraceWriter).byteLength).toBeGreaterThan(0);
  });

  it('streams top-level ResourceSpans from protobuf without whole-file buffering', async () => {
    const first = (await parse(
      encodeJson(createOtlpJsonDocument('first')),
      OtlpTraceJsonLoader
    )) as OtlpTrace;
    const second = (await parse(
      encodeJson(createOtlpJsonDocument('second')),
      OtlpTraceJsonLoader
    )) as OtlpTrace;
    const firstBytes = new Uint8Array(encodeSync(first, OtlpTraceWriter));
    const secondBytes = new Uint8Array(encodeSync(second, OtlpTraceWriter));
    const combined = new Uint8Array(firstBytes.length + secondBytes.length);
    combined.set(firstBytes);
    combined.set(secondBytes, firstBytes.length);

    const batches = await parseInBatches(
      [combined.subarray(0, 5), combined.subarray(5)],
      OtlpTraceLoader,
      {otlpTrace: {batchSize: 1}}
    );
    const spanNames: string[] = [];
    for await (const batch of batches) {
      const result = batch as OtlpTraceBatch;
      if (result.table === 'spans') {
        spanNames.push(result.data.getChild('name')?.get(0) as string);
      }
    }
    expect(spanNames).toEqual(['first', 'second']);
  });
});
