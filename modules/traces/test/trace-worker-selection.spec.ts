// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table} from 'apache-arrow';
import {PerfettoTraceLoaderWithParser} from '../src/perfetto-trace-loader';
import {OtlpTraceLoaderWithParser} from '../src/otlp-trace-loader';
import {OtlpTraceJsonLoaderWithParser} from '../src/otlp-trace-json-loader';
import {JaegerTraceLoaderWithParser} from '../src/jaeger-trace-loader';
import {ZipkinTraceLoaderWithParser} from '../src/zipkin-trace-loader';
import {selectTraceWorkerLoader as selectLoader} from '../src/workers/trace-worker';

test.each([
  ['perfettoTrace', PerfettoTraceLoaderWithParser],
  ['otlpTrace', OtlpTraceLoaderWithParser],
  ['otlpTraceJson', OtlpTraceJsonLoaderWithParser],
  ['jaegerTrace', JaegerTraceLoaderWithParser],
  ['zipkinTrace', ZipkinTraceLoaderWithParser]
] as const)('shared trace worker selects the %s implementation', (identifier, loader) => {
  expect(selectLoader({_workerLoaderId: identifier})).toBe(loader);
});

test.each([
  undefined,
  'unknown'
])('shared trace worker rejects unsupported identity %s', identifier => {
  expect(() => selectLoader({_workerLoaderId: identifier})).toThrow(
    'Trace worker does not support loader'
  );
});

test('Chrome worker adapter forces Arrow while retaining validation limits', async () => {
  const loader = selectLoader({_workerLoaderId: 'chromeTrace'});
  const input = new TextEncoder().encode(
    JSON.stringify({
      traceEvents: [
        {name: 'first', ph: 'i', pid: 1, tid: 1},
        {name: 'second', ph: 'i', pid: 1, tid: 1}
      ]
    })
  ).buffer;
  const defaultResult = await loader.parse!(input);
  expect(defaultResult).toBeInstanceOf(Table);
  expect(defaultResult.numRows).toBe(2);
  const invalidDocument = JSON.parse(new TextDecoder().decode(input));
  invalidDocument.traceEvents[1].ph = 'invalid';
  const invalidInput = new TextEncoder().encode(JSON.stringify(invalidDocument)).buffer;
  const limited = await loader.parse!(invalidInput, {
    shape: 'json',
    chromeTrace: {shape: 'json'},
    maxLength: 1
  });
  expect(limited).toBeInstanceOf(Table);
  expect(limited.numRows).toBe(2);
  await expect(loader.parse!(invalidInput)).rejects.toThrow();
});
