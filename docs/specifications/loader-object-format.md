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

## Loader Object Format v1.0

### Common Fields

| Field               | Type       | Default  | Description                                                     |
| ------------------- | ---------- | -------- | --------------------------------------------------------------- |
| `name`              | `String`   | Required | Short name of the loader ('OBJ', 'PLY' etc)                     |
| `extension`         | `String`   | Required | Three letter (typically) extension used by files of this format |
| `extensions`        | `String[]` | Required | Array of file extension strings supported by this loader        |
| `category`          | `String`   | Optional | Indicates the type/shape of data                                |
| `encoding`          | `String`   | Optional | Physical serialization, such as `json`, `xml`, `protobuf`, `arrow`, `parquet`, `zip`, `image` or `binary` |
| `format`            | `String`   | Optional | Logical file format or subtype, such as `geojson`, `tilejson`, `mvt`, `gltf` or `flatgeobuf` |
| `parse` \| `worker` | `Function` | `null`   | Every non-worker loader should expose a `parse` function.       |

Note: Only one of `extension` or `extensions` is required. If both are supplied, `extensions` will be used.

`encoding` and `format` are additive metadata. Existing `text` and `binary` fields remain compatibility hints used by core loading and encoding paths.

### Test Function

| Field      | Type       | Default  | Description                                                                                   |
| ---------- | ---------- | -------- | --------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test`     | `Function` | `String` | `String[]`                                                                                    | `null` | Guesses if a binary format file is of this format by examining the first bytes in the file. If the test is specified as a string or array of strings, the initial bytes are expected to be "magic bytes" matching one of the provided strings. |
| `testText` | `Function` | `null`   | Guesses if a text format file is of this format by examining the first characters in the file |

### Parser Functions

Each (non-worker) loader should define a `parse` function. Additional parsing functions can be exposed depending on the loaders capabilities, to optimize for text parsing, synchronous parsing, streaming parsing, etc:

| Parser function field | Type       | Default | Description                                                                            |
| --------------------- | ---------- | ------- | -------------------------------------------------------------------------------------- |
| `parse`               | `Function` | `null`  | Asynchronously parses binary data (e.g. file contents) asynchronously (`ArrayBuffer`). |
| `parseInBatches`      | `Function` | `null`  | Parses binary data chunks (`ArrayBuffer`) to output data "batches"                     |
| `parseSync`           | `Function` | `null`  | Atomically and synchronously parses binary data (e.g. file contents) (`ArrayBuffer`)   |
| `parseTextSync`       | `Function` | `null`  | Atomically and synchronously parses a text file (`String`)                             |

Synchronous parsers are more flexible as they can support synchronous parsing which can simplify application logic and debugging, and iterator-based parsers are more flexible as they can support batched loading of large data sets in addition to atomic loading.

You are encouraged to provide the most capable parser function you can (e.g. `parseSync` or `parseToIterator` if possible). Unless you are writing a completely new loader from scratch, the appropriate choice often depends on the capabilities of an existing external "loader" that you are working with.

### Parser Function Signatures

- `async parse(data : ArrayBuffer, options : Object, context : Object) : Object`
- `parseSync(data : ArrayBuffer, options : Object, context : Object) : Object`
- `parseInBatches(data : AsyncIterator, options : Object, context : Object) : AsyncIterator`

The `context` parameter will contain the following fields

- `parse` or `parseSync`
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
