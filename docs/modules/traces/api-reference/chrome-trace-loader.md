import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# ChromeTraceLoader

<TracesDocsTabs active="chrometraceloader" />

`ChromeTraceLoader` loads Chrome Trace Event JSON payloads. By default it returns a validated JSON
trace object. Set `chromeTrace.shape: 'arrow-table'` to convert trace events into an Apache Arrow
table.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {ChromeTraceLoader} from '@loaders.gl/traces';

const trace = await load(url, ChromeTraceLoader);

const table = await load(url, ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table'}
});
```

## Options

| Option                    | Type                         | Default | Description                                      |
| ------------------------- | ---------------------------- | ------- | ------------------------------------------------ |
| `chromeTrace.shape`       | `'json' \| 'arrow-table'`    | `json`  | Selects the whole-file parser output shape.      |
| `chromeTrace.batchSize`   | `number`                     | `256`   | Maximum events per Arrow record batch.           |
| `maxLength`               | `number`                     |         | Maximum input byte length accepted by the loader. |

## Streaming

`parseInBatches` currently requires `chromeTrace.shape: 'arrow-table'` and yields Arrow record
batches. The module also exports helpers that consume Chrome trace file chunks or Arrow batches and
publish trace snapshots.
