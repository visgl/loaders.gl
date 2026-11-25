# @loaders.gl/traces/chrome-trace

Read and write Chrome Trace events, build Arrow tables, and consume event streams.

```typescript
import {ChromeTraceLoader} from '@loaders.gl/traces/chrome-trace';
import {ChromeTraceWriter} from '@loaders.gl/traces/chrome-trace/bundled';
import {parseChromeTrace, consumeChromeTraceArrowStream} from '@loaders.gl/traces/chrome-trace/api';
```

## API

| Export | Kind |
| --- | --- |
| `ChromeTraceLoader` | Loader |
| `ChromeTraceLoaderOptions` | Type |
| `ChromeTraceWriter` | Writer |
| `ChromeTraceWriterOptions` | Type |
| `ChromeTraceEventArrowRecordBatch` | Type |
| `ChromeTraceEventArrowTable` | Type |
| `ChromeTraceEventSchema` | Type |
| `ChromeTraceFileSchema` | Type |
| `ChromeTraceValidationOptions` | Type |
| `parseChromeTrace` | Utility |
| `ChromeTraceParseOptions` | Type |
| `consumeChromeTraceArrowStream` | Utility |
| `consumeChromeTraceEventStream` | Utility |
| `consumeChromeTraceFileStream` | Utility |
| `streamChromeTraceArrowChunks` | Utility |
| `streamChromeTraceEventChunks` | Utility |
| `streamChromeTraceFileChunks` | Utility |
| `ChromeTraceEventStreamItem` | Type |
| `ChromeTraceStreamOptions` | Type |
| `ChromeTrace` | Type |
| `ChromeTraceCounter` | Type |
| `ChromeTraceFlow` | Type |
| `ChromeTraceInstant` | Type |
| `ChromeTraceProcess` | Type |
| `ChromeTraceSpan` | Type |
| `ChromeTraceThread` | Type |
| `ChromeTraceLoaderWithParser` | Loader |

## Reference

- [chrome trace loader](/docs/modules/traces/api-reference/chrome-trace-loader)
- [chrome trace writer](/docs/modules/traces/api-reference/chrome-trace-writer)
- [chrome trace streaming](/docs/modules/traces/api-reference/chrome-trace-streaming)

See the [traces module](/docs/modules/traces) for installation and related entrypoints.
