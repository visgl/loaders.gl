---
title: MapLibre Tile
description: Load compact MapLibre Tile vector data through loaders and sources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MLT module"
  title="Decode compact vector tiles without changing the tile path."
  description="`@loaders.gl/mlt` supports MapLibre Tile vector data through a direct loader and a URL-addressed source. Both paths use the MapLibre decoder while fitting the normal loaders.gl data contracts."
  tone="blue"
  meta={['MapLibre Tile', 'Vector tiles', 'Loader and source']}
  links={[
    {label: 'MLT APIs', to: '/docs/modules/mlt/api-reference/mlt-loader'},
    {label: 'MLT format', to: '/docs/modules/mlt/formats/mlt'},
    {label: 'MLT source', to: '/docs/modules/mlt/api-reference/mlt-source-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The MLT module boundary"
  title="Choose direct decoding or a tile source."
  description="Use the loader when the tile bytes are already available. Use the source when the application needs URL addressing, metadata, and repeated tile requests."
  tone="blue"
  items={[
    {label: 'Loader', value: 'Decode one MapLibre Tile payload'},
    {label: 'Source', value: 'Resolve and request URL-addressed tiles'},
    {label: 'Geometry', value: 'GeoJSON-style or binary geometry output'},
    {label: 'Decoder', value: '@maplibre/mlt implementation underneath'}
  ]}
/>

<ReferenceBoundary
  title="Loader and source details"
  description="The reference below covers installation, entry points, examples, output choices, and the upstream decoder relationship."
  tone="blue"
/>

<p className="badges">
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
