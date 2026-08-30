---
title: WMTS format
description: Request map imagery through advertised tile matrix sets and resource templates.
hide_title: true
page_style: designed
---

import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {ClientExample} from '@site/src/components';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC tiled image service"
  title="WMTS"
  description="WMTS describes discrete tile matrix sets, layers, styles, image formats, and resource templates. The source negotiates those capabilities before requesting visible imagery."
  tone="mint"
  logos={[{alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'}]}
  meta={['WMTS 1.0.0', 'Tile matrix sets', 'KVP and REST templates']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WMS format', to: '/docs/modules/wms/formats/wms'}
  ]}
/>

<DocLiveExample label="WMTS tile service example" height="440px">
  <ClientExample kind="wms" format="WMTS" />
</DocLiveExample>

<WmsDocsTabs active="wmts" />

<DocOrientation
  eyebrow="The tile-service sequence"
  title="Read the capabilities. Choose the matrix. Fetch the tile."
  description="WMTS differs from WMS by making tiling explicit. The client selects an advertised layer, style, format, and matrix set, then requests tiles using the service’s identifiers."
  tone="mint"
  items={[
    {label: 'Discover', value: 'Layers, styles, formats, and matrix sets'},
    {label: 'Select', value: 'A compatible CRS and tile matrix'},
    {label: 'Request', value: 'KVP parameters or REST resource URL'},
    {label: 'Render', value: 'Visible image tiles through TileSource'}
  ]}
/>

WMTS serves map imagery on discrete, advertised tile matrix sets. `WMTSSourceLoader` implements a
loaders.gl `TileSource` and negotiates the layer, style, format, and grid from capabilities.

<ReferenceBoundary
  title="WMTS capabilities and tile requests"
  description="The sections below cover capabilities parsing, matrix selection, request encodings, image formats, CRS metadata, and rendering integration."
  tone="mint"
/>

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| WMTS 1.0.0 | Supported | Capabilities parsing and KVP `GetTile` requests |
| `GetCapabilities` | Supported | `WMTSCapabilitiesLoader` parses layers and matrix sets |
| Normalized tile metadata | Supported | `getMetadata()` exposes extent, CRS, tile size, and tile grid |
| `GetTile` | Supported | Fetches and decodes advertised image formats |
| KVP request encoding | Supported | Standard query-parameter operation |
| RESTful resource templates | Supported | Uses advertised `ResourceURL` templates or `wmts.urlTemplate` |
| SOAP encoding | Not supported | Outside browser-oriented tile retrieval |
| Layer selection | Supported | Select by advertised layer identifier |
| Tile matrix-set selection | Supported | Explicit selection or compatibility-ranked automatic choice |
| Style and image format | Supported | Select advertised identifiers and MIME types |
| Non-numeric matrix identifiers | Supported | Zoom levels map to identifiers from capabilities |
| CRS and axis metadata | Supported | Normalized from the chosen matrix set |
| `GetFeatureInfo` | Not exposed | Use a direct request when supported by the server |
| deck.gl rendering | First class | `SourceLayer` requests visible image tiles from the source |

## Create a tile source

```ts
import {createDataSource} from '@loaders.gl/core';
import {WMTSSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(wmtsUrl, [WMTSSourceLoader], {
  wmts: {
    layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/jpeg'
  }
});

const metadata = await source.getMetadata();
const image = await source.getTile({z: 3, x: 2, y: 4});
```

If the service endpoint and capabilities document have different URLs, provide `capabilitiesUrl`
under `wmts`.

## Tile-grid negotiation

WMTS matrix sets may use provider-specific identifiers, origins, resolutions, and limits. The source
keeps the advertised grid rather than assuming a Google-style XYZ pyramid. Applications can select
a matrix set explicitly; otherwise loaders.gl ranks compatible sets and normalizes the selected
grid for consumers such as deck.gl.

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {WMTSSourceLoader} from '@loaders.gl/wms';

const layer = new SourceLayer({
  id: 'satellite-imagery',
  data: wmtsUrl,
  loaders: [WMTSSourceLoader],
  sourceOptions: {
    wmts: {layer: layerId, tileMatrixSet: matrixSetId}
  }
});
```

## References

- [OGC Web Map Tile Service standard](https://www.ogc.org/standard/wmts/)
