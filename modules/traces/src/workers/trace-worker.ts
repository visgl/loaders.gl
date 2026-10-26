// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {ChromeTraceLoaderWithParser} from '../chrome-trace-loader';
import {PerfettoTraceLoaderWithParser} from '../perfetto-trace-loader';
import {OtlpTraceLoaderWithParser} from '../otlp-trace-loader';
import {OtlpTraceJsonLoaderWithParser} from '../otlp-trace-json-loader';
import {JaegerTraceLoaderWithParser} from '../jaeger-trace-loader';
import {ZipkinTraceLoaderWithParser} from '../zipkin-trace-loader';

/** Selects the requested trace parser without transferring parser functions. */
function selectLoader(options: Record<string, any>): LoaderWithParser {
  switch (options._workerLoaderId) {
    case 'chromeTrace':
      return {
        ...ChromeTraceLoaderWithParser,
        /** Keeps event objects and metadata reconstruction on the caller. */
        parse(input, parserOptions) {
          return ChromeTraceLoaderWithParser.parse(input, {
            ...parserOptions,
            shape: 'arrow-table',
            chromeTrace: {...parserOptions?.chromeTrace, shape: 'arrow-table'}
          });
        }
      };
    case 'perfettoTrace':
      return PerfettoTraceLoaderWithParser;
    case 'otlpTrace':
      return OtlpTraceLoaderWithParser;
    case 'otlpTraceJson':
      return OtlpTraceJsonLoaderWithParser;
    case 'jaegerTrace':
      return JaegerTraceLoaderWithParser;
    case 'zipkinTrace':
      return ZipkinTraceLoaderWithParser;
    default:
      throw new Error(`Trace worker does not support loader ${options._workerLoaderId}`);
  }
}

createLoaderWorker(ChromeTraceLoaderWithParser, selectLoader);
