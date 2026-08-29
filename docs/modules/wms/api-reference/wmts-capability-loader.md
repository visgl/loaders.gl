---
title: WMTSCapabilitiesLoader
description: Parse OGC WMTS capabilities into typed tile-service metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WMS module · capabilities loader"
  title="WMTSCapabilitiesLoader"
  description="Read an OGC Web Map Tile Service capabilities response into the layer and request metadata needed to select a tile matrix set and formats."
  tone="cyan"
  meta={['From v3.4', 'OGC WMTS', 'Typed metadata']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'CRS and tile grids', to: '/docs/modules/wms/api-reference/crs-and-tile-grids'},
    {label: 'WMS capabilities', to: '/docs/modules/wms/api-reference/wms-capabilities-loader'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Turn a verbose tile catalog into selection metadata."
  description="The loader extracts the commonly needed service, layer, request, CRS, and bounding-box fields while leaving the full XML path available through XMLLoader when an application needs more."
  tone="cyan"
  items={[
    {label: 'Layers', value: 'Names, titles, bounds, and supported CRS'},
    {label: 'Requests', value: 'Operations and advertised MIME types'},
    {label: 'Tile matrix', value: 'Metadata for choosing a compatible grid'},
    {label: 'Boundary', value: 'Typed subset of a larger XML standard'}
  ]}
/>

<ReferenceBoundary
  title="WMTSCapabilitiesLoader reference"
  description="The sections below document the request, parsed data, options, and the intentionally focused extraction scope."
  tone="cyan"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-3.4" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `WMTSCapabilitiesLoader` parses the XML-formatted response from the
the [OGC](https://www.opengeospatial.org/) [WMTS](https://www.ogc.org/standards/wms) (Web Map Tile Service) standard `GetCapabilities` request into a typed JavaScript data structure.

> Note that the WMTS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If full access to the capabilities data is desired, it is possible to use the `XMLLoader` directly.

| Loader                | Characteristic                                        |
| --------------------- | ----------------------------------------------------- |
| File Extension        | `.xml`                                                |
| File Type             | Text                                                  |
| File Format           | [WMTS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure                                        |
| Decoder Type          | Synchronous                                           |
| Worker Thread Support | Yes                                                   |
| Streaming Support     | No                                                    |

## Usage

```typescript
import {WMTSCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a WMTS request
const url = `${WMTS_SERVICE_URL}?REQUEST=GetCapabilities`;

const data = await load(url, WMTSCapabilitiesLoader, options);
```

## Parsed Data Format

```typescript
/** All capabilities of a WMTS service. Typed data structure extracted from XML */
export type WMTSCapabilities = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layer: WMTSLayer;
  requests: Record<string, WMTSRequest>;
};

type WMTSLayer = {
  name: string;
  title?: string;
  srs?: string[];
  boundingBox?: [number, number, number, number];
  layers?: WMTSLayer[];
};

type WMTSRequest = {
  name: string;
  mimeTypes: string[];
};
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
