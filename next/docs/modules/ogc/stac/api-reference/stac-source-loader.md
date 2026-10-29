STAC source

# STACSourceLoader

STACSourceLoader handles static catalog traversal and API Item Search, returning metadata and asset links while leaving the selected file to its native format loader.

[STAC module](https://loaders.gl/next/docs/modules/ogc/stac.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/stac.md)[Cloud-native formats](https://loaders.gl/next/docs/specifications/cloud-native-geospatial.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/cloud-native-geospatial.md)

Catalog discovery

## Find the asset before opening the bytes.

STAC narrows a dataset by space, time, collection, and links. Once an asset is selected, its native loaders.gl source can handle the actual data.

01

### Catalog or API

collections · search

spacetime

the&#x6E;**→**

02

### STAC item

one spatiotemporal record

extentcontext

the&#x6E;**→**

03

### Asset link

role · media type · URL

chooseinspect

the&#x6E;**→**

04

### Native loader

Parquet · GeoTIFF · Zarr

decodescan

STAC describes where the data is and what it means; the format loader remains responsible for decoding it.

Discovery before decoding

## Search the catalog. Select the asset. Load it natively.

The source keeps catalog traversal and asset selection separate from parsing. That lets a single discovery workflow lead to GeoTIFF, Parquet, Zarr, or another specialized loader.

01

Mode

Static linked catalog or STAC API

02

Search

Collections, bbox, time, and pagination

03

Traverse

Bounded child and asset discovery

04

Return

Items, collections, and role-filtered assets

The `STACSourceLoader` creates a lightweight source for static STAC catalogs and STAC APIs.

```
import {load} from '@loaders.gl/core';

import {STACSourceLoader} from '@loaders.gl/ogc/stac';



const source = await load('https://example.com/stac', STACSourceLoader);
```

For synchronous `createDataSource()`, import the runtime-bearing subpath:

```
import {createDataSource} from '@loaders.gl/core';

import {STACSourceLoader} from '@loaders.gl/ogc/stac/stac-source';



const source = createDataSource('https://example.com/stac', STACSourceLoader);
```

Detailed guide

## STAC source methods

The sections below cover construction, metadata, collections, search, traversal, pagination, and asset selection.

## Methods[​](#methods "Direct link to Methods")

### `getMetadata(options?)`[​](#getmetadataoptions "Direct link to getmetadataoptions")

Returns the root Catalog or Collection, declared conformance classes, and the detected mode:

* `api` when the root exposes Item Search or API conformance declarations.
* `static` for a linked catalog of JSON documents.

The root document is fetched once and cached.

### `getCollections(options?)`[​](#getcollectionsoptions "Direct link to getcollectionsoptions")

Returns Collections. For a STAC API it follows the Collections endpoint and `next` links. For a static catalog it follows only `child` links and never downloads Items.

Options are `signal`, `maxDepth`, and `maxRequests`.

### `search(query?)`[​](#searchquery "Direct link to searchquery")

Runs server-side STAC API Item Search and follows `next` links. Both GET and POST pagination links are supported, including the STAC `body` and `merge` fields.

Supported core query properties are:

* `ids`
* `collections`
* `bbox`
* `datetime`
* `limit`
* `signal`

`search()` throws for a static catalog. This prevents a seemingly small query from silently crawling a very large linked catalog.

### `traverse(options?)`[​](#traverseoptions "Direct link to traverseoptions")

Explicitly traverses `child` and `item` links in a static catalog. URLs are cycle-protected and bounded by `maxDepth` and `maxRequests`. The core `ids`, `collections`, `bbox`, and `datetime` constraints are evaluated locally before Items are yielded.

### `getAssets(item, selection?)`[​](#getassetsitem-selection "Direct link to getassetsitem-selection")

Returns assets with URLs resolved against the Item document. Assets can be selected by `roles` and exact `mediaTypes`.

## Options[​](#options "Direct link to Options")

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). The settings below are specific to this source.

| Option             | Type     | Default | Description                                                |
| ------------------ | -------- | ------- | ---------------------------------------------------------- |
| `stac.maxDepth`    | `number` | `32`    | Default maximum static child-catalog depth.                |
| `stac.maxRequests` | `number` | `1000`  | Default maximum documents fetched by one static traversal. |

## Capabilities[​](#capabilities "Direct link to Capabilities")

`STACSource.capabilities` implements the protocol-neutral `CatalogSource` capability contract from `@loaders.gl/core/loader-utils`. STAC-specific methods remain available directly on `STACSource`.

The initial implementation does not advertise text search or CQL2. Those extensions can be added without changing the shared catalog contract.
