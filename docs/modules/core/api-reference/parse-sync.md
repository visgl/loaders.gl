---
title: parseSync
description: Parse already-loaded data synchronously with a parser-capable loader.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core parsing API"
  title="Use a synchronous parser when the loader supports it."
  description="`parseSync` turns already-loaded text or binary data into a decoded result without returning a promise. It is useful for small, local inputs, but most loaders and browser pipelines should use the asynchronous APIs."
  tone="blue"
  meta={['Synchronous parsing', 'Already-loaded data', 'Parser-capable loaders only']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Async parse', to: '/docs/modules/core/api-reference/parse'},
    {label: 'Loader options', to: '/docs/modules/core/api-reference/loader-options'}
  ]}
/>

<DocOrientation
  eyebrow="The sync boundary"
  title="Load first. Parse immediately. Keep the call site explicit."
  description="Synchronous parsing does not fetch data and cannot suspend for worker setup or asynchronous codecs. The loader must provide a synchronous parser for the chosen input."
  tone="blue"
  items={[
    {label: 'Input', value: 'Text or binary data already in memory'},
    {label: 'Loader', value: 'A parser-capable loader or loader list'},
    {label: 'Context', value: 'Options and optional source URL'},
    {label: 'Output', value: 'Decoded value, or an error when sync parsing is unavailable'}
  ]}
/>

:::caution
Synchronous parsing requires a parser-bearing loader with `parseSync` or
`parseTextSync`. Metadata loaders must be preloaded first. Use `parse` for loaders
that only provide asynchronous parsing.
:::

## Signature

```typescript
parseSync(data, loader, options?, context?): unknown
```

- `data`: a `string`, `ArrayBuffer`, shared array buffer, or typed-array view.
  Fetch responses, files, blobs, streams, iterators, and promises must be read
  before this call; use the async `parse` API for those inputs.
- `loader`: one parser-bearing loader or an array of candidates.
- `options`: see [LoaderOptions](./loader-options).
- `context`: optional loader context, including a `url` hint for selection.

Returns the loader's decoded value. It throws if no loader matches or synchronous
parsing is unavailable. `core.nothrow: true` returns `null` when selection fails;
it does not turn an asynchronous parser into a synchronous one.

## Usage

```typescript
import {fetchFile, parseSync, preload} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const response = await fetchFile(url);
const arrayBuffer = await response.arrayBuffer();
const parserLoader = await preload(OBJLoader);
const mesh = parseSync(arrayBuffer, parserLoader);
```

Handle errors with an ordinary `try`/`catch`; `parseSync` does not return a promise.
Inside a composite loader, use `parseSyncFromContext` from
`@loaders.gl/loader-utils` to preserve the parent context.
