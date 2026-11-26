// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ChromeTraceWriter} from '@loaders.gl/traces/chrome-trace';
import {ChromeTraceWriter as BundledChromeTraceWriter} from '@loaders.gl/traces/chrome-trace/bundled';
import {JaegerTraceWriter} from '@loaders.gl/traces/jaeger';
import {JaegerTraceWriter as BundledJaegerTraceWriter} from '@loaders.gl/traces/jaeger/bundled';
import {OtlpTraceJsonWriter, OtlpTraceWriter} from '@loaders.gl/traces/otlp';
import {
  OtlpTraceJsonWriter as BundledOtlpTraceJsonWriter,
  OtlpTraceWriter as BundledOtlpTraceWriter
} from '@loaders.gl/traces/otlp/bundled';
import {PerfettoTraceWriter} from '@loaders.gl/traces/perfetto';
import {PerfettoTraceWriter as BundledPerfettoTraceWriter} from '@loaders.gl/traces/perfetto/bundled';
import {ZipkinTraceWriter} from '@loaders.gl/traces/zipkin';
import {ZipkinTraceWriter as BundledZipkinTraceWriter} from '@loaders.gl/traces/zipkin/bundled';

test.each([
  ['ChromeTraceWriter', ChromeTraceWriter, BundledChromeTraceWriter],
  ['JaegerTraceWriter', JaegerTraceWriter, BundledJaegerTraceWriter],
  ['OtlpTraceJsonWriter', OtlpTraceJsonWriter, BundledOtlpTraceJsonWriter],
  ['OtlpTraceWriter', OtlpTraceWriter, BundledOtlpTraceWriter],
  ['PerfettoTraceWriter', PerfettoTraceWriter, BundledPerfettoTraceWriter],
  ['ZipkinTraceWriter', ZipkinTraceWriter, BundledZipkinTraceWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
