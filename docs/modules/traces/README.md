import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Traces

<TracesDocsTabs active="overview" />

The `@loaders.gl/traces` module provides parsers for browser and system performance trace formats.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/traces
```

## Loaders

| Loader                                                                      | Description                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| [`ChromeTraceLoader`](/docs/modules/traces/api-reference/chrome-trace-loader) | Loads Chrome Trace Event JSON as JSON or Arrow. |

## Additional APIs

`@loaders.gl/traces` also exports `parseChromeTrace(...)` and streaming helpers for logical events,
Arrow batches, and chunked Chrome trace files.
