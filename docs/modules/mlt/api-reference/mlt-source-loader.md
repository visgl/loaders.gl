---
title: MLTSourceLoader
description: Read MapLibre Tile data from URL-addressed tile services.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MLT source loader"
  title="Fetch compact vector tiles through a source."
  description="`MLTSourceLoader` connects URL-addressed MapLibre Tile services to the loaders.gl source API. It resolves tile URLs, decodes MLT payloads, and can return GeoJSON-style tables or binary geometry."
  tone="blue"
  meta={['MapLibre Tile', 'URL tile services', 'GeoJSON or binary output']}
  links={[
    {label: 'MLT module', to: '/docs/modules/mlt'},
    {label: 'MLT format', to: '/docs/modules/mlt/formats/mlt'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The MLT source boundary"
  title="Keep tile addressing separate from tile decoding."
  description="The source owns service URLs and metadata, while `MLTLoader` owns the compact binary payload. Applications can request tiles through the common source lifecycle."
  tone="blue"
  items={[
    {label: 'Input', value: 'Tile service URL and optional metadata URL'},
    {label: 'Addressing', value: 'z/x/y tile coordinates with configurable extension'},
    {label: 'Decode', value: 'MLT layers, attributes, and geometry'},
    {label: 'Output', value: 'GeoJSON table or binary geometry'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

The `MLTSourceLoader` dynamically loads MapLibre Tile (`.mlt`) data from URL based tile services.

| Source         | Characteristic                                 |
| -------------- | ---------------------------------------------- |
| File Extension | `.mlt`                                         |
| File Type      | Binary Archive                                 |
| File Format    | [MapLibre Tile](/docs/modules/mlt/formats/mlt) |
| Data Format    | GeoJSON                                        |

## Usage

<ReferenceBoundary
  title="Source options and output details"
  description="The reference below documents construction, URL and metadata options, coordinate output, layer filtering, and related loader APIs."
  tone="blue"
/>

```typescript
import {createDataSource} from '@loaders.gl/core';
import {MLTSourceLoader} from '@loaders.gl/mlt';

const source = createDataSource('https://example.com/tiles', [MLTSourceLoader]);
const features = await source.getTile({x: 0, y: 0, z: 0});
```

## Options

| Option            | Type                                      | Default           | Description                                                        |
| ----------------- | ----------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `mlt.extension`   | `string`                                  | `.mlt`            | Tile URL extension.                                                |
| `mlt.metadataUrl` | `string \| null`                          | `null`            | Optional metadata URL override (`tile.json` by default is not assumed). |
| `mlt.coordinates` | `'wgs84' \| 'local'`                      | `wgs84`           | Coordinates output from parsed tiles.                              |
| `mlt.shape`       | `'geojson-table' \| 'binary-geometry'`    | `geojson-table`   | Returned geometry shape.                                           |
| `mlt.layers`      | `string[]`                                | `N/A`             | Optional layer filter before decoding geometry.                    |

## Additional references

- [MLTLoader](/docs/modules/mlt/api-reference/mlt-loader)
- [MLT format](/docs/modules/mlt/formats/mlt)

## Attribution

`MLTSourceLoader` fetches URL-addressed MLT tiles and parses them via [`MLTLoader`](/docs/modules/mlt/api-reference/mlt-loader), which uses the [@maplibre/mlt](https://github.com/maplibre/mlt) decoder implementation.
