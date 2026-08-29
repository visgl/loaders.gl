---
title: encode
description: Turn category data into bytes with a writer.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core writing API"
  title="Turn application data back into a format."
  description="`encode()` hands category data to a writer and returns the encoded bytes. Use it when your application has already loaded or transformed the data and the next step is export, persistence, or transfer."
  tone="mint"
  meta={['Async API', 'Writer-driven output', 'Binary or text']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'},
    {label: 'Writer object format', to: '/docs/specifications/writer-object-format'}
  ]}
/>

<DocOrientation
  eyebrow="The encode boundary"
  title="Start with data. Let the writer define the output."
  description="Writers own the target format and its options. The core API can use a worker when the writer supports it, while synchronous and batched variants make the execution model explicit."
  tone="mint"
  items={[
    {label: 'Input', value: 'Category data accepted by the writer'},
    {label: 'Writer', value: 'A writer with an async or sync encoder'},
    {label: 'Execution', value: 'Main thread, worker, or Node command-line tool'},
    {label: 'Output', value: 'ArrayBuffer, text, or an async byte sequence'}
  ]}
/>

<ReferenceBoundary
  title="Encoding details"
  description="The reference below covers atomic, text, synchronous, batched, and Node-only URL-to-URL encoding."
  tone="mint"
/>

## Atomic encoding

```typescript
encode(data, writer, options?): Promise<ArrayBuffer>
encodeSync(data, writer, options?): ArrayBuffer
```

`encode()` calls the writer asynchronously and may use the writer’s worker implementation. The
writer determines the accepted data shape and the format of the returned bytes. `encodeSync()`
requires a synchronous writer implementation and throws when the writer cannot encode
synchronously.

```typescript
import {encode} from '@loaders.gl/core';
import {DracoWriter} from '@loaders.gl/draco';

const arrayBuffer = await encode(meshData, DracoWriter);
```

## Text and batch variants

```typescript
encodeText(data, writer, options?): Promise<string>
encodeTextSync(data, writer, options?): string
encodeInBatches(data, writer, options?): AsyncIterable<ArrayBuffer>
encodeTextInBatches(data, writer, options?): AsyncIterable<ArrayBuffer>
```

Text helpers are convenience APIs and may convert through bytes when the writer does not expose a
native text encoder. Batch helpers require the writer to implement the corresponding batch method;
they do not silently fall back to one large atomic encode.

## Options

- `options` are passed to the writer and may include loader-utils module overrides.
- `options.modules` supplies top-level overrides for writers that load external JavaScript or WASM
  runtimes.
- `options.log` accepts an object with `log`, `info`, `warn`, and `error` methods. Set it to `null`
  to disable logging where supported.

## Node-only URL conversion

Writers that expose `encodeURLtoURL()` can convert one file to another through an external command
line tool in Node.js:

```typescript
encodeURLtoURL(inputUrl, outputUrl, writer, options?): Promise<string>
```

This path is not available in the browser and depends on the writer’s command-line integration.
