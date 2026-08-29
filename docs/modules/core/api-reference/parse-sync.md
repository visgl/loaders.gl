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
Synchronous parsing is not supported by all loaders. Refer to the documentation for each loader.
:::

:::caution
When calling parse from a loader to invoke a sub-loader, do not use this function. Use `parseSyncWithContext` counterparts in `@loaders.gl/loader-utils``
:::

The `parseSync()` function parses data synchronously using the provided loader, if possible.

```typescript
parseSync(data: ArrayBuffer | string, loaders: Loader, options?: LoaderOptions, url?: string]]) : unknown
parseSync(data: ArrayBuffer | string, loaders: Loader[], options?: LoaderOptions, url?: string]]) : unknown
```

- `data`: already loaded data, either in binary or text format. This parameter can be any of the following types:
  - `Response`: `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer`: Parse from binary data in an array buffer
  - `string`: Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator`: Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
    can also be supplied.
- `loaders`: can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: See [`LoaderOptions`](./loader-options).
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Return value depends on the _loader object_ category, or `null`, in which case asynchronous parsing is required.

<ReferenceBoundary
  title="Synchronous parsing details"
  description="The reference below covers supported inputs, loader selection, options, return values, limitations, and error handling."
  tone="blue"
/>

## Usage

```typescript
import {fetchFile, parseSync} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const response = await fetchFile(url);
const arraybuffer = await response.arrayBuffer();

data = parseSync(arraybuffer, OBJLoader);
// Application code here
...
```

Handling errors

```typescript
try {
  const data = await parseSync(data);
} catch (error) {
  console.log(error);
}
```
