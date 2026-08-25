# @loaders.gl/mlt

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

Support for loading [MapLibre Tile](/docs/modules/mlt/formats/mlt) vector tiles.

## Installation

```bash
npm install @loaders.gl/mlt
npm install @loaders.gl/core
```

## Loaders and Sources

| Loader / Source | Description |
| --------------- | ----------- |
| [`MLTLoader`](/docs/modules/mlt/api-reference/mlt-loader) | Loads MapLibre Tile vector tiles. |
| [`MLTSourceLoader`](/docs/modules/mlt/api-reference/mlt-source-loader) | Loads MapLibre Tile data as a tile source. |

## Examples

- [MLT example](/examples/tiles/mlt)

## Attribution

The `MLTLoader` uses the [@maplibre/mlt](https://github.com/maplibre/mlt) package for tile decoding.
