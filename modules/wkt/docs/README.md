# Overview

The `@loaders.gl/wkt` module handles the [Well Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format, an ASCII format that defines geospatial geometries; and the [Well Known Binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format, WKT's binary equivalent.

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader                                                   |
| -------------------------------------------------------- |
| [`WKBLoader`](modules/wkt/docs/api-reference/wkb-loader) |
| [`WKTLoader`](modules/wkt/docs/api-reference/wkt-loader) |
| [`WKTWriter`](modules/wkt/docs/api-reference/wkt-writer) |

## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
