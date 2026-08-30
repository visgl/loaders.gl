---
title: STACSourceLoader
description: Discover and search static catalogs or STAC APIs before handing selected assets to native loaders.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {DatasetDiscoveryGraphic} from '@site/src/components/docs/dataset-discovery-graphic';

<DocPageHeader
  eyebrow="STAC source"
  title="STACSourceLoader"
  description="STACSourceLoader handles static catalog traversal and API Item Search, returning metadata and asset links while leaving the selected file to its native format loader."
  tone="mint"
  meta={['Static catalogs', 'Item Search', 'Asset selection']}
  links={[
    {label: 'STAC module', to: '/docs/modules/stac'},
    {label: 'Cloud-native formats', to: '/docs/specifications/cloud-native-geospatial'}
  ]}
/>

<DatasetDiscoveryGraphic kind="stac" />

<DocOrientation
  eyebrow="Discovery before decoding"
  title="Search the catalog. Select the asset. Load it natively."
  description="The source keeps catalog traversal and asset selection separate from parsing. That lets a single discovery workflow lead to GeoTIFF, Parquet, Zarr, or another specialized loader."
  tone="mint"
  items={[
    {label: 'Mode', value: 'Static linked catalog or STAC API'},
    {label: 'Search', value: 'Collections, bbox, time, and pagination'},
    {label: 'Traverse', value: 'Bounded child and asset discovery'},
    {label: 'Return', value: 'Items, collections, and role-filtered assets'}
  ]}
/>

The `STACSourceLoader` creates a lightweight source for static STAC catalogs and STAC APIs.

```ts
import {load} from '@loaders.gl/core';
import {STACSourceLoader} from '@loaders.gl/stac';

const source = await load('https://example.com/stac', STACSourceLoader);
```

For synchronous `createDataSource()`, import the runtime-bearing subpath:

```ts
import {createDataSource} from '@loaders.gl/core';
import {STACSourceLoader} from '@loaders.gl/stac/stac-source';

const source = createDataSource('https://example.com/stac', STACSourceLoader);
```

<ReferenceBoundary
  title="STAC source methods"
  description="The sections below cover construction, metadata, collections, search, traversal, pagination, and asset selection."
  tone="mint"
/>

## Methods

### `getMetadata(options?)`

Returns the root Catalog or Collection, declared conformance classes, and the detected mode:

- `api` when the root exposes Item Search or API conformance declarations.
- `static` for a linked catalog of JSON documents.

The root document is fetched once and cached.

### `getCollections(options?)`

Returns Collections. For a STAC API it follows the Collections endpoint and `next` links. For a
static catalog it follows only `child` links and never downloads Items.

Options are `signal`, `maxDepth`, and `maxRequests`.

### `search(query?)`

Runs server-side STAC API Item Search and follows `next` links. Both GET and POST pagination links
are supported, including the STAC `body` and `merge` fields.

Supported core query properties are:

- `ids`
- `collections`
- `bbox`
- `datetime`
- `limit`
- `signal`

`search()` throws for a static catalog. This prevents a seemingly small query from silently
crawling a very large linked catalog.

### `traverse(options?)`

Explicitly traverses `child` and `item` links in a static catalog. URLs are cycle-protected and
bounded by `maxDepth` and `maxRequests`. The core `ids`, `collections`, `bbox`, and `datetime`
constraints are evaluated locally before Items are yielded.

### `getAssets(item, selection?)`

Returns assets with URLs resolved against the Item document. Assets can be selected by `roles` and
exact `mediaTypes`.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `stac.maxDepth` | `number` | `32` | Default maximum static child-catalog depth. |
| `stac.maxRequests` | `number` | `1000` | Default maximum documents fetched by one static traversal. |

## Capabilities

`STACSource.capabilities` implements the protocol-neutral `CatalogSource` capability contract from
`@loaders.gl/loader-utils`. STAC-specific methods remain available directly on `STACSource`.

The initial implementation does not advertise text search or CQL2. Those extensions can be added
without changing the shared catalog contract.
