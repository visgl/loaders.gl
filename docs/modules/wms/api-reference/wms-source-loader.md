---
title: WMSSourceLoader
description: Discover WMS capabilities and request georeferenced map images through a typed source.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WMS source"
  title="Treat a map service as a queryable image source."
  description="WMSSourceLoader discovers service capabilities, validates request parameters, and returns typed map images or feature information through the common source interface."
  tone="mint"
  meta={['Capabilities', 'GetMap', 'ImageService']}
  links={[
    {label: 'WMS format', to: '/docs/modules/wms/formats/wms'},
    {label: 'WMS module', to: '/docs/modules/wms'}
  ]}
/>

<DocOrientation
  eyebrow="The source workflow"
  title="Discover once. Request images with explicit bounds."
  description="The source keeps service metadata and request construction together, while exposing the result in a form a map layer or application can consume."
  tone="mint"
  items={[
    {label: 'Discover', value: 'Capabilities, layers, styles, CRS, and dimensions'},
    {label: 'Configure', value: 'Version and default WMS parameters'},
    {label: 'Request', value: 'Map images, feature info, or legends'},
    {label: 'Return', value: 'Typed image-service results and errors'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

The `WMSSourceLoader` class helps applications interact with a WMS service (discover its capabilities, request map images and information about geospatial features, etc).

The `WMSSourceLoader` provides a type safe API that forms valid WMS URLs and issues requests, handles WMS version differences and edge cases under the hood and parses results and errors into strongly typed JavaScript objects.

The `WMSSourceLoader` implements the `ImageService` interface, allowing WMS services to be used as one interchangeable source of asynchronously generated map image data.

<ReferenceBoundary
  title="WMS source methods"
  description="The sections below cover source construction, capabilities, map requests, feature information, version handling, and authentication."
  tone="mint"
/>

## Usage

A `WMSSourceLoader` instance provides type safe methods to send requests to a WMS service and parse the responses:

```typescript
const wmsService = createDataSource(WMS_SERVICE_URL, [WMSSourceLoader], {
  wmsParameters: {layers: ['oms']}
});
const mapImage = await wmsService.getMap({
  width: 800,
  height: 600,
  bbox: [30, 70, 35, 75]
});
// Render mapImage...
```

Capabilities metadata can be queried:

```typescript
const wmsService = createDataSource(WMS_SERVICE_URL, [WMSSourceLoader]);
const capabilities = await wmsService.getCapabilities({});
// Check capabilities
```

The WMS version as well as other default WMS parameters can be specified in the constructor

```typescript
// Specify the older 1.1.1 version (1.3.0 is the default)
const wmsService = createDataSource(WMS_SERVICE_URL, [WMSSourceLoader], {
  wms: {wmsParameters: {version: '1.1.1', layers: ['oms']}}
});
const getMap = await wmsService.getMap({
  width: 800,
  height: 600,
  bbox: [30, 70, 35, 75]
});
```

For shared loading controls and parser configuration, see
[Source options](/docs/developer-guide/using-sources#options).

For special use cases, is possible to use the `WMSSourceLoader` to just generate URLs, so that the application issue its own requests and parse responses.

```typescript
const wmsService = createDataSource(WMS_SERVICE_URL, [WMSSourceLoader]);
const getMapUrl = await wmsService.getMapURL({
  width: 800,
  height: 600,
  bbox: [30, 70, 35, 75],
  layers: ['oms']
});
const response = await myCustomFetch(getMapURL);
// parse...
```

## Methods

### constructor()

Creates a `WMSImageSource` instance. Prefer `createDataSource` to inject the core parsing API.

```typescript
constructor(url: string, options: WMSSourceLoaderOptions, coreApi?: CoreAPI)
```

Put `substituteCRS84`, `wmsParameters`, and `vendorParameters` under `options.wms`.
Shared fetch and worker controls belong under `options.core`.

### getCapabilities()

Get Capabilities

```typescript
  async getCapabilities(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSCapabilities>
```

Returns a capabilities objects. See [`WMSCapabilitiesLoader`][/docs/modules/wms/api-reference/wms-capabilities-loader] for detailed information about the `WMSCapabilities` type.

### getMap()

Get a map image

```typescript
  async getMap(wmsParameters: WMSGetMapParameters, vendorParameters?: Record<string, unknown>): Promise<ImageType>
```

```typescript
export type WMSGetMapParameters = {
  bbox: [number, number, number, number]; // bounding box of the requested map image
  width: number; // pixel width of returned image
  height: number; // pixels

  // constructor parameters can be overridden in the actual calls
  layers?: string | string[]; // Layers to render
  styles?: unknown; // Styling
  crs?: string; // crs for the image (not the bounding box)
  format?: 'image/png'; // requested format for the return image
};
```

### getFeatureInfo()

> This request is not supported by all WNS servers. Use `getCapabilities()` to determine if it is.

Get Feature Info for a coordinate

```typescript
  async getFeatureInfo(
    wmsParameters: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSFeatureInfo>
```

```typescript
// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&
export type WMSGetFeatureInfoParameters = {
  x: number; // x coordinate for the feature info request
  y: number; // y coordinate for the feature info request
  query_layers: string[]; // list of layers to query (could be different from rendered layers)
  info_format?: 'text/plain' | 'application/geojson' | 'application/vnd.ogc.gml'; // MIME type of returned feature info
  layers: string[]; // Layers to render
  styles?: unknown; // Styling
  bbox: [number, number, number, number]; // bounding box of the requested map image
  width: number; // pixel width of returned image
  height: number; // pixels
  crs?: string; // crs for the image (not the bounding box)
  format?: 'image/png'; // requested format for the return image
};
```

### describeLayer()

> This request is not supported by all WNS servers. Use `getCapabilities()` to determine if it is.

Get more information about a layer.

```typescript
  async describeLayer(
    wmsParameters: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSLayerDescription>
```

```typescript
export type WMSDescribeLayerParameters = {
  layer: string; // Layer to describe
};
```

### getLegendGraphic()

> This request is not supported by all WMS servers. Use `getCapabilities()` to determine if it is.

Get an image with a semantic legend

```typescript
  async getLegendGraphic(
    wmsParameters: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType>
```

```typescript
export type WMSGetLegendGraphicParameters = {};
```

## Limitations

The `WMSSourceLoader` only supports WMS URL parameters generation and HTTP GET requests against a WMS server. The OGC WMS standard also allows WMS services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported.
