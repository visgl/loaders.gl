---
title: createDataSource
description: Create a queryable source for datasets that need metadata, tiles, or repeated requests.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core source API"
  title="Keep the dataset open when one request is not enough."
  description="`createDataSource()` turns a URL or loaded resource into a source object with an API for metadata, tiles, windows, searches, or other repeated requests."
  tone="mint"
  meta={['Queryable source', 'Metadata first', 'Repeated requests']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The source boundary"
  title="Open once. Discover and request many times."
  description="A source keeps format-specific state behind a common interface. That is useful for tiled archives, catalogs, image services, and cloud datasets where a single parse call cannot express the workflow."
  tone="mint"
  items={[
    {label: 'Open', value: 'URL, Blob, Response, or source-supported resource'},
    {label: 'Select', value: 'One source loader or best-effort matching'},
    {label: 'Discover', value: 'Metadata, schema, bounds, layers, or assets'},
    {label: 'Request', value: 'Tiles, windows, features, scans, or pages'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

This function synchronously creates a runtime `DataSource` from a source-supported input, such as
a URL, Blob, or an already loaded table. The returned object offers methods for requesting metadata
and additional data; construction does not imply that the entire dataset has been loaded.

Use `parse()` for parser loaders. `load()` can also accept a source loader and asynchronously return
its runtime source, including resolving a lazy implementation when supported.

<ReferenceBoundary
  title="Data source construction and options"
  description="The sections below document source selection, runtime construction, flat options, and examples using tiled data sources."
  tone="mint"
/>

## Usage

Provide a source loader with a runtime factory and an input it supports:

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';

const source = createDataSource(url, [PMTilesSourceLoader]);
const metadata = await source.getMetadata();
```

Automatic selection is performed with best-effort heuristics.

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MVTSourceLoader} from '@loaders.gl/mvt';

const dataSource = createDataSource(url, [PMTilesSourceLoader, MVTSourceLoader]);
const metadata = await dataSource.getMetadata();
```

## Functions

### createDataSource()

```ts
createDataSource(data: unknown, sources: SourceLoader[], options?: DataSourceOptions) : DataSource
```

Creates a runtime `DataSource` either using the provided source loader or source loaders.

- `data`: The resource that the selected source will use. Supported inputs depend on the source.
- `sources`: An array of source loaders with runtime factories. A one-element array uses that source
  directly; multiple candidates use `core.type` or best-effort selection.
- `options`: One flat options object, with shared `core` controls beside source and parser namespaces.
  Options and the returned source type are inferred from the supplied factories.

Returns:

- A valid runtime data source.

## Options

See [Source options](/docs/developer-guide/using-sources#options) for the shared options convention,
loading controls, parser options, precedence, and TypeScript behavior. Source-specific settings
are documented on each source loader’s reference page.
