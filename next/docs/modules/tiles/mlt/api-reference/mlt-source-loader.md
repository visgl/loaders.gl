MLT source loader

# Fetch compact vector tiles through a source.

`MLTSourceLoader` connects URL-addressed MapLibre Tile services to the loaders.gl source API. It resolves tile URLs, decodes MLT payloads, and returns Arrow tables with GeoArrow geometry by default.

[MLT module](https://loaders.gl/next/docs/modules/tiles/mlt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt.md)[MLT format](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The MLT source boundary

## Keep tile addressing separate from tile decoding.

The source owns service URLs and metadata, while \`MLTLoader\` owns the compact binary payload. Applications can request tiles through the common source lifecycle.

01

Input

Tile service URL and optional metadata URL

02

Addressing

z/x/y tile coordinates with configurable extension

03

Decode

MLT layers, attributes, and geometry

04

Output

Arrow table with GeoArrow geometry by default

![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)

The `MLTSourceLoader` dynamically loads MapLibre Tile (`.mlt`) data from URL based tile services.

| Source         | Characteristic                                                                      |
| -------------- | ----------------------------------------------------------------------------------- |
| File Extension | `.mlt`                                                                              |
| File Type      | Binary Archive                                                                      |
| File Format    | [MapLibre Tile](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md) |
| Data Format    | Arrow with GeoArrow, GeoJSON, or binary geometry                                    |

## Usage[​](#usage "Direct link to Usage")

Detailed guide

## Source options and output details

The reference below documents construction, URL and metadata options, coordinate output, layer filtering, and related loader APIs.

```
import {createDataSource} from '@loaders.gl/core';

import {MLTSourceLoader} from '@loaders.gl/tiles/mlt';



const source = createDataSource('https://example.com/tiles', [MLTSourceLoader]);

const arrowTable = await source.getTile({x: 0, y: 0, z: 0});
```

## Options[​](#options "Direct link to Options")

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). The settings below are specific to this source.

| Option                        | Type                                                    | Default                         | Description                                                             |
| ----------------------------- | ------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `mlt.extension`               | `string`                                                | `.mlt`                          | Tile URL extension.                                                     |
| `mlt.metadataUrl`             | `string \| null`                                        | `null`                          | Optional metadata URL override (`tile.json` by default is not assumed). |
| `mlt.coordinates`             | `'wgs84' \| 'local'`                                    | `wgs84`                         | Coordinates output from parsed tiles.                                   |
| `mlt.shape`                   | `'geojson-table' \| 'binary-geometry' \| 'arrow-table'` | `arrow-table`                   | Returned geometry shape.                                                |
| `geoarrow.encodingPreference` | `'geoarrow.wkb' \| 'geoarrow.geometry' \| 'optimized'`  | `geoarrow.wkb` for Arrow output | Arrow geometry encoding preference.                                     |
| `mlt.layers`                  | `string[]`                                              | `N/A`                           | Optional layer filter before decoding geometry.                         |

## Additional references[​](#additional-references "Direct link to Additional references")

* [MLTLoader](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-loader.md)
* [MLT format](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

## Attribution[​](#attribution "Direct link to Attribution")

`MLTSourceLoader` fetches URL-addressed MLT tiles and parses them via [`MLTLoader`](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-loader.md), which uses the [@maplibre/mlt](https://github.com/maplibre/mlt) decoder implementation.
