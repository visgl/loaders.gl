---
title: '@loaders.gl/core'
description: The small, shared API for loading, parsing, streaming, selecting, and writing data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
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

The `@loaders.gl/core` module contains the core API of loaders.gl

The core API offers functions to parse loaded data in various ways using loaders

- [`parse`](/docs/modules/core/api-reference/parse)
- [`parseSync`](/docs/modules/core/api-reference/parse-sync)
- [`parseInBatches`](/docs/modules/core/api-reference/parse-in-batches)

To fetch data, use the built-in `fetch` or the API compatible but more capable `fetchFile`

- [`fetchFile`](/docs/modules/core/api-reference/fetch-file)

To load (fetch and parse) data

- [`load`](/docs/modules/core/api-reference/load)

To register loaders, or select a loader that matches a file from a list of candidate loaders:

- [`registerLoaders`](/docs/modules/core/api-reference/register-loaders)
- [`selectLoader`](/docs/modules/core/api-reference/select-loader)

To encode and save data

- [`encode`](/docs/modules/core/api-reference/encode)
- [`write-file`](/docs/modules/core/api-reference/write-file)
- [`save`](/docs/modules/core/api-reference/save)

As well as some utility functions.

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
