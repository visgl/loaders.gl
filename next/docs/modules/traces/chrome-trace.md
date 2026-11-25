# @loaders.gl/traces/chrome-trace

Read and write Chrome Trace events, build Arrow tables, and consume event streams.

```
import {ChromeTraceLoader} from '@loaders.gl/traces/chrome-trace';

import {ChromeTraceWriter} from '@loaders.gl/traces/chrome-trace/bundled';

import {parseChromeTrace, consumeChromeTraceArrowStream} from '@loaders.gl/traces/chrome-trace/api';
```

## API[​](#api "Direct link to API")

| Export                             | Kind    |
| ---------------------------------- | ------- |
| `ChromeTraceLoader`                | Loader  |
| `ChromeTraceLoaderOptions`         | Type    |
| `ChromeTraceWriter`                | Writer  |
| `ChromeTraceWriterOptions`         | Type    |
| `ChromeTraceEventArrowRecordBatch` | Type    |
| `ChromeTraceEventArrowTable`       | Type    |
| `ChromeTraceEventSchema`           | Type    |
| `ChromeTraceFileSchema`            | Type    |
| `ChromeTraceValidationOptions`     | Type    |
| `parseChromeTrace`                 | Utility |
| `ChromeTraceParseOptions`          | Type    |
| `consumeChromeTraceArrowStream`    | Utility |
| `consumeChromeTraceEventStream`    | Utility |
| `consumeChromeTraceFileStream`     | Utility |
| `streamChromeTraceArrowChunks`     | Utility |
| `streamChromeTraceEventChunks`     | Utility |
| `streamChromeTraceFileChunks`      | Utility |
| `ChromeTraceEventStreamItem`       | Type    |
| `ChromeTraceStreamOptions`         | Type    |
| `ChromeTrace`                      | Type    |
| `ChromeTraceCounter`               | Type    |
| `ChromeTraceFlow`                  | Type    |
| `ChromeTraceInstant`               | Type    |
| `ChromeTraceProcess`               | Type    |
| `ChromeTraceSpan`                  | Type    |
| `ChromeTraceThread`                | Type    |
| `ChromeTraceLoaderWithParser`      | Loader  |

## Reference[​](#reference "Direct link to Reference")

* [chrome trace loader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)
* [chrome trace writer](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)
* [chrome trace streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)

See the [traces module](https://loaders.gl/next/docs/modules/traces.md) for installation and related entrypoints.
