Dataset discovery

# @loaders.gl/ogc/stac

The STAC module discovers datasets, links, time ranges, and spatial extents from static catalogs or API searches, then leaves the selected asset free to use its native loader.

[STAC source](https://loaders.gl/next/docs/modules/ogc/stac/api-reference/stac-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/stac/api-reference/stac-source-loader.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

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

## Catalogs describe data. Assets carry it.

STAC keeps search and traversal separate from format parsing. Once an item and asset are selected, the application can hand the link to GeoTIFF, Parquet, COG, or another specialized loader.

01

Static

Traverse linked catalogs when explicitly requested

02

API

Search items by collection, time, or bbox

03

Asset

Select links by role, media type, or name

04

Next step

Load the asset with its native format module

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `@loaders.gl/ogc/stac` module discovers datasets and assets described by the [SpatioTemporal Asset Catalog specification](https://stacspec.org/). It supports both linked static catalogs and server-side STAC API Item Search without imposing a rendering framework or a database dependency.

Detailed guide

## STAC source usage

The sections below cover installation, catalog traversal, API search, and asset selection.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/services
```

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {STACSourceLoader} from '@loaders.gl/ogc/stac';



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

See [`STACSourceLoader`](https://loaders.gl/next/docs/modules/ogc/stac/api-reference/stac-source-loader.md) for the source API and [STAC format notes](https://loaders.gl/next/docs/modules/ogc/stac/formats/stac.md) for protocol behavior.

## Browser access[​](#browser-access "Direct link to Browser access")

Catalog discovery does not guarantee that an asset can be read by a browser. A browser-native remote Parquet query requires the asset host to allow cross-origin requests, accept byte ranges, and expose headers such as `Content-Range` and `Content-Length`.

The source preserves all provider assets so the application can select an appropriate mirror. Probe the selected URL with a small range request and handle a rejected fetch separately from a server that returns the whole object instead of `206 Partial Content`.
