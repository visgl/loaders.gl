---
title: '@loaders.gl/core'
description: The small, shared API for loading, parsing, streaming, selecting, and writing data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {LoaderSelectionGraphic} from '@site/src/components/docs/loader-selection-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core module"
  title="@loaders.gl/core"
  description="One entry point for loading bytes, selecting parsers, streaming batches, and writing results—while each format stays in its own module."
  tone="blue"
  meta={['load() and parse()', 'Loader selection', 'Streaming and writing']}
  links={[
    {label: 'Get started', to: '/docs/developer-guide/get-started'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: 'Core API reference', to: '/docs/modules/core/api-reference/load'}
  ]}
/>

<LoaderSelectionGraphic />

<DocOrientation
  eyebrow="The core module"
  title="One small API around many format modules."
  description="Core handles fetching, parser selection, loading, streaming, encoding, and saving. Format packages remain optional, so an application can compose only the paths it needs."
  tone="blue"
  items={[
    {label: 'Fetch', value: 'Resolve URLs, files, streams, and request options'},
    {label: 'Select', value: 'Choose explicit loaders or detect among candidates'},
    {label: 'Process', value: 'Load complete results or iterate through batches'},
    {label: 'Write', value: 'Encode and save compatible application data'}
  ]}
/>

`@loaders.gl/core` coordinates format loaders and writers. Pass explicit loaders
to keep format selection and return types local to your application.

| Task | APIs and guidance |
| --- | --- |
| Fetch and parse | [`load`](/docs/modules/core/api-reference/load), [`loadInBatches`](/docs/modules/core/api-reference/load-in-batches) |
| Parse loaded data | [`parse`](/docs/modules/core/api-reference/parse), [`parseSync`](/docs/modules/core/api-reference/parse-sync), [`parseInBatches`](/docs/modules/core/api-reference/parse-in-batches) |
| Prepare metadata loaders | [`preload` and `preloadSync`](/docs/developer-guide/using-unbundled-loaders) |
| Select a loader | [`selectLoader` and `selectLoaderSync`](/docs/modules/core/api-reference/select-loader) |
| Open a runtime source | [`createDataSource`](/docs/modules/core/api-reference/create-data-source), or async `load` for lazy source loaders |
| Fetch bytes | [`fetchFile`](/docs/modules/core/api-reference/fetch-file), or the runtime's `fetch` |
| Encode data | [`encode`, `encodeText`, and synchronous/batched variants](/docs/modules/core/api-reference/encode) |
| Adapt streams | [`makeIterator` and `makeStream`](/docs/modules/core/api-reference/iterator-utilities) |
| Configure shared defaults | [`setLoaderOptions` and `getLoaderOptions`](/docs/modules/core/api-reference/set-loader-options) |

`registerLoaders` remains a [deprecated compatibility API](/docs/modules/core/api-reference/register-loaders).
Core does not export `save` or `writeFile`; save encoded bytes with your platform's
filesystem, download, or upload API.

<ReferenceBoundary
  title="Core APIs and lightweight entry points"
  description="The reference below lists the parser, fetch, loader-selection, encoding, writing, and micro-loader APIs."
  tone="blue"
/>

## Micro-Loaders

Loaders with limited functionality but with minimal bundle size impact:

| Loader       | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `JSONLoader` | A minimal non-streaming JSON loader that uses the built-in `JSON.parse` function |
| `NullLoader` | A loader-object that ignores input data and always returns `null`.               |
