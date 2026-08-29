---
title: STAC module
description: Discover cloud datasets and assets through static catalogs or the STAC API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DatasetDiscoveryGraphic} from '@site/src/components/docs/dataset-discovery-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Dataset discovery"
  title="Find the asset before choosing the loader."
  description="The STAC module discovers datasets, links, time ranges, and spatial extents from static catalogs or API searches, then leaves the selected asset free to use its native loader."
  tone="mint"
  meta={['STAC catalogs', 'API Item Search', 'Asset links']}
  links={[
    {label: 'STAC source', to: '/docs/modules/stac/api-reference/stac-source-loader'},
    {label: 'Services module', to: '/docs/modules/services'}
  ]}
/>

<DatasetDiscoveryGraphic kind="stac" />

<DocOrientation
  eyebrow="Discovery before decoding"
  title="Catalogs describe data. Assets carry it."
  description="STAC keeps search and traversal separate from format parsing. Once an item and asset are selected, the application can hand the link to GeoTIFF, Parquet, COG, or another specialized loader."
  tone="mint"
  items={[
    {label: 'Static', value: 'Traverse linked catalogs when explicitly requested'},
    {label: 'API', value: 'Search items by collection, time, or bbox'},
    {label: 'Asset', value: 'Select links by role, media type, or name'},
    {label: 'Next step', value: 'Load the asset with its native format module'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `@loaders.gl/stac` module discovers datasets and assets described by the
[SpatioTemporal Asset Catalog specification](https://stacspec.org/). It supports both linked static
catalogs and server-side STAC API Item Search without imposing a rendering framework or a database
dependency.

<ReferenceBoundary
  title="STAC source usage"
  description="The sections below cover installation, catalog traversal, API search, and asset selection."
  tone="mint"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/stac
```

## Usage

```ts
import {load} from '@loaders.gl/core';
import {STACSourceLoader} from '@loaders.gl/stac';

const source = await load('https://example.com/catalog.json', STACSourceLoader);
const {mode, root} = await source.getMetadata();

if (mode === 'api') {
  for await (const item of source.search({
    collections: ['buildings'],
    bbox: [-71.1, 42.3, -71.0, 42.4]
  })) {
    console.log(source.getAssets(item, {roles: ['data']}));
  }
} else {
  // Static catalogs are only crawled when the application explicitly opts in.
  for await (const item of source.traverse({maxDepth: 4, maxRequests: 100})) {
    console.log(item.id);
  }
}
```

See [`STACSourceLoader`](/docs/modules/stac/api-reference/stac-source-loader) for the source API and
[STAC format notes](/docs/modules/stac/formats/stac) for protocol behavior.

## Browser access

Catalog discovery does not guarantee that an asset can be read by a browser. A browser-native
remote Parquet query requires the asset host to allow cross-origin requests, accept byte ranges,
and expose headers such as `Content-Range` and `Content-Length`.

The source preserves all provider assets so the application can select an appropriate mirror.
Probe the selected URL with a small range request and handle a rejected fetch separately from a
server that returns the whole object instead of `206 Partial Content`.
