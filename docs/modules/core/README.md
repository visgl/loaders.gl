---
title: '@loaders.gl/core'
description: The public loaders.gl API, with common utilities available through dedicated subpaths.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {LoaderSelectionGraphic} from '@site/src/components/docs/loader-selection-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core module"
  title="@loaders.gl/core"
  description="The public loaders.gl API for loading, parsing, streaming, and encoding data across format modules. Common utilities are available through dedicated subpaths such as core/schema, core/loader-utils, and core/worker-utils."
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
| Prepare metadata loaders | [`preload` and `preloadSync`](/docs/developer-guide/using-metadata-loaders) |
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

## Utility subpaths

Reusable scan, geometry construction, geometry processing, and codec APIs are available through independent subpaths:

| Import | Utilities |
| --- | --- |
| [`@loaders.gl/core/constants`](./api-reference/constants.md) | Branch, repository URL, and worker tag constants. |
| [`@loaders.gl/core/loader-utils`](./loader-utils/README.md) | Loader contracts, streams, file systems, and source utilities. |
| [`@loaders.gl/core/worker-utils`](./worker-utils/README.md) | Worker pools, messaging, and transfer helpers. |
| [`@loaders.gl/core/schema`](./schema/README.md) | Shared schemas, table and geometry types. |
| [`@loaders.gl/core/schema-utils`](./schema-utils/README.md) | Schema conversion, table helpers, and Arrow transport. |
| [`@loaders.gl/core/polyfills`](./polyfills/api-reference/README.md) | Independent Node platform adapters. |
| `@loaders.gl/core/scan` | Scan planning and execution, Arrow queries, portable predicates, and format-neutral source wrappers. |
| `@loaders.gl/core/arrow-geometry` | Geometry builders and loader-facing conversion helpers. |
| `@loaders.gl/core/geoarrow` | GeoArrow inspection, validation, conversion, coordinate operations, clustering, and spatial indexes. |
| `@loaders.gl/core/wkt` | Geometry codec helpers; TWKB is also available from `@loaders.gl/core/wkt/twkb`. |

Import these APIs through their subpaths. The core root entrypoint keeps its existing exports. Format loader and writer descriptors remain in their format modules, including `@loaders.gl/geospatial/wkt`; database adapters remain in `@loaders.gl/sql`.

```typescript
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/core/scan';
import {GeoArrowBuilder} from '@loaders.gl/core/arrow-geometry';
import {inspectGeoArrowVector} from '@loaders.gl/core/geoarrow';
import {convertWKTToGeometry} from '@loaders.gl/core/wkt';
```

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).
