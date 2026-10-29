OGC service module

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# @loaders.gl/ogc/wms

The WMS module covers classic OGC Web Services, modern OGC APIs, and GML response parsing. It keeps capability discovery, request construction, and decoded results in explicit source contracts.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

⛶⛶ Explore fullscreen

Remote data, explicit steps

## Discover once. Request only what the application needs.

Service sources keep endpoint metadata, request construction, and decoded results separate. That makes a remote dataset behave like a predictable part of the data path.

01 · discover

### OGC service endpoint

Capabilities describe collections, operations, CRS, and response formats.

WMS / WMTSWFS / FeaturesWCS / EDR

pla&#x6E;**→**

02 · request

### Build a standards-shaped request

Select a layer, collection, extent, time, or coverage slice.

layersbboxdatetimeformat

normaliz&#x65;**→**

[03 · application result](https://loaders.gl/next/docs/modules/ogc/wms.md)

### [ImageSource · VectorSource · RasterSource](https://loaders.gl/next/docs/modules/ogc/wms.md)

[Decoded results can move into maps, analysis, scans, or application-owned code.<!-- --> ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)

The source owns protocol details; the application owns how returned features, pixels, tiles, or tables are used.

The service path

## Discover capabilities before requesting data.

Service endpoints vary in operations and response formats. The module exposes that variability explicitly so an application can choose the right source, request, and output path.

01

Maps and tiles

WMS, WMTS, and OGC API Tiles

02

Features

WFS, OGC API Features, and GML

03

Coverages

WCS, OGC API Coverages, and EDR

04

Catalogs

CSW and OWS Context discovery paths

The `@loaders.gl/ogc/wms` module provides read-only clients and response parsers for classic OGC Web Services, modern OGC APIs, and GML. Despite the historical package name, it covers maps, tiles, features, coverages, environmental observations, and catalogs.

Detailed guide

## Service support details

The sections below provide the service matrix, installation instructions, source APIs, and protocol-specific boundaries.

## Service matrix[​](#service-matrix "Direct link to Service matrix")

| Service or format                                                                                            | Primary source or loader      | Data category              | Status              | Best use                                        |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------- | -------------------------- | ------------------- | ----------------------------------------------- |
| [WMS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)                                      | `WMSSourceLoader`             | Rendered image             | ✅ Supported        | Dynamic maps, feature information, legends      |
| [WMTS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md)                                    | `WMTSSourceLoader`            | Image tiles                | ✅ Supported        | Capability-driven tiled imagery                 |
| [WFS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md)                                      | `WFSSourceLoader`             | Vector features            | ✅ Supported        | GeoJSON or streaming GML feature queries        |
| [WCS](https://loaders.gl/next/docs/modules/ogc/wms/formats/wcs.md)                                      | `WCSCoverageSourceLoader`     | Analytical raster          | ⚠️ Focused          | Binary coverages and decoded LERC               |
| [CSW](https://loaders.gl/next/docs/modules/ogc/wms/formats/csw.md)                                      | `CSWSourceLoader`             | Catalog records            | ⚠️ Focused          | Read-only catalog search and service references |
| [GML](https://loaders.gl/next/docs/modules/ogc/wms/formats/gml.md)                                      | `GMLLoader`                   | Vector format              | ⚠️ Supported subset | High-volume WFS feature ingestion               |
| [OGC API Features](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md#ogc-api-features)   | `OGCAPIFeaturesSourceLoader`  | Vector features            | ⚠️ Minimal          | Common collections/items read path              |
| [OGC API Tiles](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md#ogc-api-tiles)         | `OGCAPITilesSourceLoader`     | Tile bytes                 | ⚠️ Minimal          | Known tile templates                            |
| [OGC API Coverages](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md#ogc-api-coverages) | `OGCAPICoveragesSourceLoader` | Coverage data              | ⚠️ Minimal          | Common collection coverage endpoint             |
| [OGC API EDR](https://loaders.gl/next/docs/modules/ogc/wms/services/ogc-api.md#ogc-api-edr)             | `OGCAPIEDRSourceLoader`       | Environmental observations | ⚠️ Focused          | Position, area, cube, and path queries          |
| [WMC](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmc.md)                                      | None                          | Map context                | ❌ Not implemented  | Documented to clarify scope                     |
| [OWS Context](https://loaders.gl/next/docs/modules/ogc/wms/formats/ows-context.md)                      | None                          | Service context            | ❌ Not implemented  | Documented to clarify scope                     |

“Focused” means the important read operations are implemented without claiming every optional operation. “Minimal” means a deliberately small interoperability adapter for the most common OGC API path.

ArcGIS REST services are provided by [`@loaders.gl/arcgis`](https://loaders.gl/next/docs/modules/arcgis.md).

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/ogc
```

Install `@loaders.gl/deck-layers` when visual services should render directly through deck.gl.

## Standard source workflow[​](#standard-source-workflow "Direct link to Standard source workflow")

Every service source can be created through the loaders.gl core API:

```
import {createDataSource} from '@loaders.gl/core';

import {WMSSourceLoader} from '@loaders.gl/ogc/wms';



const source = createDataSource(wmsUrl, [WMSSourceLoader], {

  wms: {wmsParameters: {layers: ['workspace:roads']}}

});



const metadata = await source.getMetadata();

const image = await source.getImage({

  layers: ['workspace:roads'],

  boundingBox: [[-10, 40], [10, 50]],

  crs: 'CRS:84',

  width: 1024,

  height: 512

});
```

The concrete runtime contract reflects the data category:

| Contract        | Typical methods                             | Services               |
| --------------- | ------------------------------------------- | ---------------------- |
| `ImageSource`   | `getMetadata`, `getImage`                   | WMS                    |
| `TileSource`    | `getMetadata`, `getTile`, `getTileData`     | WMTS, OGC API Tiles    |
| `VectorSource`  | `getMetadata`, `getSchema`, `getFeatures`   | WFS, OGC API Features  |
| Coverage source | `getMetadata`, `getCoverage`                | WCS, OGC API Coverages |
| Catalog source  | `getMetadata`, `search`                     | CSW                    |
| EDR source      | `getLandingPage`, `getCollections`, `query` | OGC API EDR            |

## deck.gl integration[​](#deckgl-integration "Direct link to deck.gl integration")

Visual service sources work through one generic `SourceLayer`:

```
import {SourceLayer} from '@loaders.gl/deck-layers';

import {WMTSSourceLoader} from '@loaders.gl/ogc/wms';



const layer = new SourceLayer({

  id: 'satellite',

  data: wmtsUrl,

  loaders: [WMTSSourceLoader],

  sourceOptions: {wmts: {layer: layerId, tileMatrixSet: matrixSetId}}

});
```

WMS, WMTS, WFS, and OGC API Features map naturally to visual source contracts. Catalog, EDR, and analytical coverage outputs require an application choice before rendering: select a catalog record, EDR representation, raster band, color ramp, and NoData policy first.

## Shared service infrastructure[​](#shared-service-infrastructure "Direct link to Shared service infrastructure")

* [`ServiceRuntime`](https://loaders.gl/next/docs/modules/ogc/wms/services/universal-service-runtime.md) adds loader selection, source caching, retries, cancellation, shared headers, and telemetry.
* [`CapabilityGraph`](https://loaders.gl/next/docs/modules/ogc/wms/services/capability-discovery.md) records relationships among discovered endpoints and ranks them by type, format, CRS, latency, and quality.
* [CRS and tile-grid utilities](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/crs-and-tile-grids.md) normalize identifiers, axis order, matrix sets, ArcGIS LODs, and antimeridian-sensitive metadata.
* [Service capabilities](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/service-capabilities.md) provide a provider-neutral metadata shape while concrete sources retain provider-specific details.

These pieces are optional. If an endpoint and protocol are already known, creating the concrete source directly remains the smallest API.

## Authentication and errors[​](#authentication-and-errors "Direct link to Authentication and errors")

All sources inherit loaders.gl fetch configuration. Applications can provide headers, credentials, request middleware, proxies, and custom fetch functions without protocol-specific wrappers. Abort signals are accepted by data requests that may be long-running.

Pass exact-origin query or bearer credentials through `core.credentials`, or configure them once on `ServiceRuntime`. They are propagated to the concrete source and redacted from runtime telemetry and normalized errors. See the [authentication guide](https://loaders.gl/next/docs/developer-guide/authentication.md).

Protocol errors are checked before parsing. WMS and related XML service exceptions use dedicated error parsers; focused adapters report the operation and HTTP status.

## Testing and conformance policy[​](#testing-and-conformance-policy "Direct link to Testing and conformance policy")

Fast tests use deterministic fixtures and block public-network access. Fixtures cover protocol versions, namespace variations, axis order, matrix grids, streaming chunk boundaries, and provider metadata. Live examples are demonstrations, not CI dependencies.

loaders.gl documents its actual implemented subset on each service page. Optional standards features are marked pass-through or unsupported instead of being implied by the existence of a capabilities parser.

## Attributions[​](#attributions "Direct link to Attributions")

`@loaders.gl/ogc/wms` uses `@loaders.gl/xml` for XML parsing. Some test fixtures originated from OpenLayers and retain their licenses in the test data; no OpenLayers runtime code is included in the published module.

## Spatial queries beyond picking[​](#spatial-queries-beyond-picking "Direct link to Spatial queries beyond picking")

Use [capability-derived WMTS configuration](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md#configure-from-capabilities) for advertised tile styles, formats, matrix sets, and grid resolutions. The [spatial-query guide](https://loaders.gl/next/docs/developer-guide/spatial-queries.md) covers extent-based WFS loading and local GeoArrow selection and snapping, including offscreen data.

The [remaining GIS work tranches](https://loaders.gl/next/docs/roadmap.md#remaining-sota-work-tranches) distinguish delivered source/query support from planned grid rendering, predicate pushdown, schema discovery, streaming, and global spatial semantics.
