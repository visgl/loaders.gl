---
title: Loader object format
description: The metadata and parser contract that lets a format participate in loaders.gl core APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader contract"
  title="Describe a format once. Plug it into the runtime."
  description="A loader object combines format identity, recognition metadata, and the parser functions an application can use. Core APIs then add fetching, workers, batching, and option handling around that contract."
  tone="cyan"
  meta={['Format metadata', 'Parser functions', 'Core integration']}
  links={[
    {label: 'Creating loaders', to: '/docs/developer-guide/creating-loaders-and-writers'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<DocOrientation
  eyebrow="The loader boundary"
  title="Identify the input, then expose the right parser."
  description="The object stays deliberately small. It tells core how to recognize the input and whether the format supports asynchronous, synchronous, streaming, or worker-backed parsing."
  tone="cyan"
  items={[
    {label: 'Identify', value: 'Name, extensions, encoding, and format'},
    {label: 'Recognize', value: 'Magic bytes or text probes when available'},
    {label: 'Parse', value: 'Async, sync, text, batch, or worker entry points'},
    {label: 'Compose', value: 'Context-aware sub-loader calls when needed'}
  ]}
/>

To be compatible with the parsing/loading functions in `@loaders.gl/core` such as `parse` and `load`, a parser needs to be described by a "loader object" conforming to the following specification.

<ReferenceBoundary
  title="Loader fields and parser functions"
  description="The sections below define common metadata, test functions, parser variants, signatures, and parser context."
  tone="cyan"
/>

## Metadata and parser implementations

A metadata loader identifies a format and exposes `preload()` to return its parser
implementation. Async core APIs perform this step automatically. A parser-bearing
loader adds the methods supported by its format. Sync APIs require those methods
to be available before the call.

### Common fields

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `string` | Stable loader identifier and option namespace. |
| `name` | `string` | Human-readable format name. |
| `module` | `string` | Owning loaders.gl module. |
| `version` | `string` | Version used for runtime assets and diagnostics. |
| `extensions` | `string[]` | Supported file extensions without leading dots. |
| `mimeTypes` | `string[]` | MIME types used for format selection. |
| `options` | `object` | Default options, normally nested under the loader ID. |
| `category` | `string` | Optional application-facing data category. |
| `encoding` | `string` | Optional physical serialization, such as `json`, `arrow`, or `binary`. |
| `format` | `string` | Optional logical format, such as `geojson` or `gltf`. |
| `worker` | `boolean \| string` | Optional worker support descriptor. |
| `preload` | `function` | Optional asynchronous parser implementation hook. |

`text` and `binary` remain compatibility hints for input handling. Format
recognition and parser availability are separate: metadata can identify a file
without carrying the parser code in the initial bundle.

### Recognition functions

| Field | Type | Purpose |
| --- | --- | --- |
| `tests` | Array of strings, byte sequences, or functions | Binary signature checks. |
| `testText` | `function` | Recognizes text from an initial sample. |

Use the fields declared in the current `Loader` type and keep probes small and
deterministic. The current core selection path reads `tests`, not a singular
`test` field.

### Parser functions

Implement the methods the underlying parser supports; not every loader needs all
variants. Metadata-only exports do not contain these methods.

| Method | Input | Result |
| --- | --- | --- |
| `parse` | `ArrayBuffer` | Promise of decoded data. |
| `parseSync` | `ArrayBuffer` | Decoded data synchronously. |
| `parseText` | `string` | Promise of decoded data. |
| `parseTextSync` | `string` | Decoded data synchronously. |
| `parseInBatches` | Chunk iterable | Async iterable of decoded batches. |

Use `parseInBatches` for incremental output. Core can adapt input representations,
but it cannot make an asynchronous codec synchronous.

### Parser Function Signatures

- `async parse(data : ArrayBuffer, options : Object, context : Object) : Object`
- `parseSync(data : ArrayBuffer, options : Object, context : Object) : Object`
- `parseInBatches(data : AsyncIterator, options : Object, context : Object) : AsyncIterator`

The `context` parameter will contain the following fields

- `coreApi` and context-bound parsing hooks for nested loading
- `url` if available

### Worker support

A loader opts into worker execution by exposing a worker descriptor (`worker: true` or a worker
URL). Browser loaders can additionally provide `loadWorker()` to construct a bundler-resolved
module worker. The worker entry point normally calls `createLoaderWorker(loader)` from
`@loaders.gl/loader-utils`, which installs the loader's atomic `parse` function and, when present,
its stateful `parseInBatches` function.

Atomic worker selection is controlled by `options.core.worker`:

- `true` uses the existing worker-capability checks.
- `false` always uses the calling thread.
- `'auto'` consults `getWorkerEstimate` before input materialization.

`getWorkerEstimate(data, options, context)` must be synchronous and metadata-only. It receives the
original `DataType` value, normalized options, and loader context, and returns a score from `0` to
`1`. Scores below `options.core.workerThreshold` (default `0.1`) use the calling thread; scores at
or above the threshold use a worker. Return `undefined` for unknown inputs. Missing, invalid, or
throwing estimates conservatively retain the normal worker-capable behavior. Do not read a stream,
advance an iterator, or buffer input from this hook.

```typescript
const MyLoader = {
  // ...format metadata and parser
  worker: true,
  getWorkerEstimate(data, options) {
    const byteLength =
      data instanceof ArrayBuffer
        ? data.byteLength
        : data instanceof Blob
          ? data.size
          : undefined;
    if (byteLength === undefined) {
      return undefined;
    }
    // This score represents expected CPU work, not just transfer size.
    return Math.min(1, byteLength / (4 * 1024 * 1024));
  }
};
```

If a loader returns values that do not survive structured cloning, provide
`serializeWorkerResult`/`deserializeWorkerResult`. Batched parsers can use the corresponding
`serializeWorkerBatch`/`deserializeWorkerBatch` hooks for per-batch transport and hydration.
