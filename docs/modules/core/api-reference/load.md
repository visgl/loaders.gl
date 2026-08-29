---
title: load
description: Fetch a resource and decode it with one or more loaders.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {LoaderSelectionGraphic} from '@site/src/components/docs/loader-selection-graphic';
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

<LoaderSelectionGraphic />

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
load(
  url: string | File | Blob,
  loaders?: Loader | Loader[],
  options?: LoaderOptions
): Promise<unknown>
```

The `load()` function fetches and parses data with a specific loader object. An array of loader
objects can be provided, in which case `load()` attempts to select the appropriate loader from the
URL, extension, content type, and file signature.

The `loaders` parameter can be omitted when loaders have been registered with
[`registerLoaders`](/docs/modules/core/api-reference/register-loaders). The selected loader tells
core whether it needs text, JSON, binary data, or a stream.

<ReferenceBoundary
  title="load inputs and options"
  description="The sections below document loader selection, accepted resource types, return values, registered loaders, path prefixes, and loader options."
  tone="cyan"
/>

:::info[Use `load()` for resources]

- Pass a URL, data URL, browser `File`, or `Blob` when core should fetch the resource.
- Pass an explicit loader when the format is known; pass an array when detection should choose.
- Use [`parse()`](/docs/modules/core/api-reference/parse) when the bytes, text, response, or
  stream are already available.

:::

The return value depends on the selected loader's category data. For example, a CSV loader may
return batches or a table, while a glTF loader returns a scenegraph-shaped object.

## Parameters

- `url` accepts HTTP(S) and data URLs, Node.js file names, browser `File` objects, and `Blob`
  objects. Non-string inputs are passed directly to the parsing path.
- `loaders` can be one loader, an array of candidate loaders, or omitted in favor of registered
  loaders.
- `options` combines core fetch/parse options with loader-specific sub-objects. See
  [`LoaderOptions`](./loader-options).

Any path prefix set by [`setPathPrefix`](./set-path-prefix) is applied to relative URLs. If
`@loaders.gl/polyfills` is installed, the same API can be used under Node.js.

## Options

A loader object, that can contain a mix of options:

- options defined by the `parse` function can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for `parse` and to each loader for details.
