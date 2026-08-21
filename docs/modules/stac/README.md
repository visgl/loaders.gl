# @loaders.gl/stac

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `@loaders.gl/stac` module discovers datasets and assets described by the
[SpatioTemporal Asset Catalog specification](https://stacspec.org/). It supports both linked static
catalogs and server-side STAC API Item Search without imposing a rendering framework or a database
dependency.

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
