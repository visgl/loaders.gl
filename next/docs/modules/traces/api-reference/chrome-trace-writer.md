Traces module · writer API

![](/images/examples/traces/chrome.svg)Chrome Trace

# ChromeTraceWriter

Serialize a typed Chrome trace Arrow table or record batch back into a Chrome Trace Event JSON container.

[Chrome trace format](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

![](/images/examples/traces/chrome.svg)Chrome Trace[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it writes

## Turn columnar trace events back into tooling data.

ChromeTraceWriter restores logical identifiers, event arguments, unknown fields, and phase-specific values so transformed trace tables can return to Chrome-compatible JSON.

01

Input

Chrome trace Arrow table or batch

02

Output

Chrome Trace Event JSON

03

Restores

Args, IDs, scopes, and passthrough fields

04

Options

Display units and top-level metadata

Detailed guide

## ChromeTraceWriter reference

The sections below document usage, restored fields, options, and schema metadata precedence.

`ChromeTraceWriter` serializes a `ChromeTraceEventArrowTable` or compatible Arrow record batch as a Chrome Trace Event JSON container.

## Usage[​](#usage "Direct link to Usage")

```
import {load, encode, encodeText} from '@loaders.gl/core';

import {ChromeTraceLoader, ChromeTraceWriter} from '@loaders.gl/traces';



const table = await load('input.json', ChromeTraceLoader, {

  chromeTrace: {shape: 'arrow-table'}

});



const jsonBytes = await encode(table, ChromeTraceWriter);

const jsonText = await encodeText(table, ChromeTraceWriter);
```

The writer decodes `args` and `extraJson`, restores unknown event fields, converts normalized identifier columns back to their logical values, and restores phase-specific scope fields.

## Options[​](#options "Direct link to Options")

| Option                        | Type                      | Default               | Description                                |
| ----------------------------- | ------------------------- | --------------------- | ------------------------------------------ |
| `chromeTrace.displayTimeUnit` | `string`                  | Arrow schema metadata | Overrides the top-level `displayTimeUnit`. |
| `chromeTrace.metadata`        | `Record<string, unknown>` | Arrow schema metadata | Overrides the top-level `metadata` object. |

Explicit options take precedence over Arrow schema metadata.

```
const json = await encodeText(table, ChromeTraceWriter, {

  chromeTrace: {

    displayTimeUnit: 'us',

    metadata: {source: 'post-processed'}

  }

});
```

## Input Contract[​](#input-contract "Direct link to Input Contract")

The writer accepts the whole-file Arrow schema documented on the [Chrome Trace format page](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md), including schema metadata produced by `ChromeTraceLoader`. It also accepts streamed Chrome Arrow record batches through the shared Arrow adapter.

The writer produces compact JSON. Source whitespace, object key order, and original numeric text formatting are not retained.
