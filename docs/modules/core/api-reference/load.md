---
title: load
description: Fetch a resource and decode it with one or more loaders.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core loading API"
  title="Give loaders a resource. Get usable data back."
  description="The `load()` function combines fetching, loader selection, and parsing for a URL or browser file. It is the shortest path from a resource to the category data your application needs."
  tone="cyan"
  meta={['Async API', 'URL and File input', 'Loader selection']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Parse in batches', to: '/docs/modules/core/api-reference/load-in-batches'}
  ]}
/>

<DocOrientation
  eyebrow="The loading path"
  title="Fetch, select, parse, return."
  description="Use one loader when the format is known, or provide a set of loaders when extension and content detection should choose the implementation. The result follows the loader’s category data contract."
  tone="cyan"
  items={[
    {label: 'Input', value: 'URL, data URL, File, Blob, or supported loaded data'},
    {label: 'Selection', value: 'Explicit loader or best-effort autodetection'},
    {label: 'Execution', value: 'Fetch bytes, text, JSON, or a stream as required'},
    {label: 'Output', value: 'Category data defined by the selected loader'}
  ]}
/>

```typescript
load(url: string | File, loaders: Loader, options?: LoaderOptions]): Promise<unknown>
load(url: string | File, loaders: Loader[], options?: LoaderOptions]): Promise<unknown>
load(url: string | File, options?: LoaderOptions): Promise<unknown>
```

The `load()` function is used to load and parse data with a specific _loader object_. An array of loader objects can be provided, in which case `load` will attempt to autodetect which loader is appropriate for the file.

The `load()` function can also be used with multiple _loaders_. `load()` takes a `url` and one or more _loader objects_, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.

<ReferenceBoundary
  title="load inputs and options"
  description="The sections below document loader selection, accepted resource types, return values, registered loaders, path prefixes, and loader options."
  tone="cyan"
/>

The `loaders` parameter can also be omitted, in which case any _loader objects_ previously registered with [`registerLoaders`](/docs/modules/core/api-reference/register-loaders) will be used.

- `url` - Urls can be data urls (`data://`) or a request (`http://` or `https://`) urls, or a file name (Node.js only). Also accepts `File` or `Blob` object (Browser only). Can also accept any format that is accepted by [`parse`](https://github.com/visgl/loaders.gl/blob/master/docs/api-reference/core/parse), with the exception of strings that are interpreted as urls.
- `loaders` - can be a single loader or an array of loaders. If single loader is provided, will force to use it. If ommitted, will use the list of pre-registered loaders (see [`registerLoaders`](/docs/modules/core/api-reference/register-loaders))
- `options` - see [`LoaderOptions`](./loader-options).

Returns:

- If `options.fetch` is not overridden with a new function.
- Return value depends on the _loader category_.

Notes:

- If `url` is not a `string`, `load` will call `parse` directly.
- Any path prefix set by `setPathPrefix` will be appended to relative urls.
- `load` takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.
- If `@loaders.gl/polyfills` is installed, `load` will work under Node.js as well.

## Options

A loader object, that can contain a mix of options:

- options defined by the `parse` function can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for for `parse` and for each loader for details.
