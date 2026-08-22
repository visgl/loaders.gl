import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# ChromeTraceWriter

<TracesDocsTabs active="chrometracewriter" />

`ChromeTraceWriter` serializes a `ChromeTraceEventArrowTable` or compatible Arrow record batch as a
Chrome Trace Event JSON container.

## Usage

```typescript
import {load, encode, encodeText} from '@loaders.gl/core';
import {ChromeTraceLoader, ChromeTraceWriter} from '@loaders.gl/traces';

const table = await load('input.json', ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table'}
});

const jsonBytes = await encode(table, ChromeTraceWriter);
const jsonText = await encodeText(table, ChromeTraceWriter);
```

The writer decodes `args` and `extraJson`, restores unknown event fields, converts normalized
identifier columns back to their logical values, and restores phase-specific scope fields.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chromeTrace.displayTimeUnit` | `string` | Arrow schema metadata | Overrides the top-level `displayTimeUnit`. |
| `chromeTrace.metadata` | `Record<string, unknown>` | Arrow schema metadata | Overrides the top-level `metadata` object. |

Explicit options take precedence over Arrow schema metadata.

```typescript
const json = await encodeText(table, ChromeTraceWriter, {
  chromeTrace: {
    displayTimeUnit: 'us',
    metadata: {source: 'post-processed'}
  }
});
```

## Input Contract

The writer accepts the whole-file Arrow schema documented on the
[Chrome Trace format page](../formats/chrome-trace), including schema metadata produced by
`ChromeTraceLoader`. It also accepts streamed Chrome Arrow record batches through the shared Arrow
adapter.

The writer produces compact JSON. Source whitespace, object key order, and original numeric text
formatting are not retained.
