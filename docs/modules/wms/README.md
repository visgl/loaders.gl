---
title: '@loaders.gl/wms'
description: Read OGC maps, tiles, features, coverages, observations, and catalog services through source APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ServiceSourceGraphic} from '@site/src/components/docs/service-source-graphic';

<DocPageHeader
  eyebrow="OGC service module"
  title="Treat geospatial services as data sources."
  description="The WMS module covers classic OGC Web Services, modern OGC APIs, and GML response parsing. It keeps capability discovery, request construction, and decoded results in explicit source contracts."
  tone="orange"
  meta={['WMS / WMTS', 'WFS / WCS', 'OGC APIs and GML']}
  links={[
    {label: 'Services module', to: '/docs/modules/services'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<ServiceSourceGraphic kind="ogc" />

<DocOrientation
  eyebrow="The service path"
  title="Discover capabilities before requesting data."
  description="Service endpoints vary in operations and response formats. The module exposes that variability explicitly so an application can choose the right source, request, and output path."
  tone="orange"
  items={[
    {label: 'Maps and tiles', value: 'WMS, WMTS, and OGC API Tiles'},
    {label: 'Features', value: 'WFS, OGC API Features, and GML'},
    {label: 'Coverages', value: 'WCS, OGC API Coverages, and EDR'},
    {label: 'Catalogs', value: 'CSW and OWS Context discovery paths'}
  ]}
/>

The `@loaders.gl/wms` module provides read-only clients and response parsers for classic OGC Web
Services, modern OGC APIs, and GML. Despite the historical package name, it covers maps, tiles,
features, coverages, environmental observations, and catalogs.

<ReferenceBoundary
  title="Service support details"
  description="The sections below provide the service matrix, installation instructions, source APIs, and protocol-specific boundaries."
  tone="orange"
/>

## Service matrix

| Service or format | Primary source or loader | Data category | Status | Best use |
| --- | --- | --- | --- | --- |
| [WMS](/docs/modules/wms/formats/wms) | `WMSSourceLoader` | Rendered image | Supported | Dynamic maps, feature information, legends |
| [WMTS](/docs/modules/wms/formats/wmts) | `WMTSSourceLoader` | Image tiles | Supported | Capability-driven tiled imagery |
| [WFS](/docs/modules/wms/formats/wfs) | `WFSSourceLoader` | Vector features | Supported | GeoJSON or streaming GML feature queries |
| [WCS](/docs/modules/wms/formats/wcs) | `WCSCoverageSourceLoader` | Analytical raster | Focused | Binary coverages and decoded LERC |
| [CSW](/docs/modules/wms/formats/csw) | `CSWSourceLoader` | Catalog records | Focused | Read-only catalog search and service references |
| [GML](/docs/modules/wms/formats/gml) | `GMLLoader` | Vector format | Supported subset | High-volume WFS feature ingestion |
| [OGC API Features](/docs/modules/wms/services/ogc-api#ogc-api-features) | `OGCAPIFeaturesSourceLoader` | Vector features | Minimal | Common collections/items read path |
| [OGC API Tiles](/docs/modules/wms/services/ogc-api#ogc-api-tiles) | `OGCAPITilesSourceLoader` | Tile bytes | Minimal | Known tile templates |
| [OGC API Coverages](/docs/modules/wms/services/ogc-api#ogc-api-coverages) | `OGCAPICoveragesSourceLoader` | Coverage data | Minimal | Common collection coverage endpoint |
| [OGC API EDR](/docs/modules/wms/services/ogc-api#ogc-api-edr) | `OGCAPIEDRSourceLoader` | Environmental observations | Focused | Position, area, cube, and path queries |
| [WMC](/docs/modules/wms/formats/wmc) | None | Map context | Not implemented | Documented to clarify scope |
| [OWS Context](/docs/modules/wms/formats/ows-context) | None | Service context | Not implemented | Documented to clarify scope |

“Focused” means the important read operations are implemented without claiming every optional
operation. “Minimal” means a deliberately small interoperability adapter for the most common OGC
API path.

ArcGIS REST services are provided by [`@loaders.gl/services`](/docs/modules/services).

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/wms
```

Install `@loaders.gl/deck-layers` when visual services should render directly through deck.gl.

## Standard source workflow

Every service source can be created through the loaders.gl core API:

```ts
import {createDataSource} from '@loaders.gl/core';
import {WMSSourceLoader} from '@loaders.gl/wms';

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

| Contract | Typical methods | Services |
| --- | --- | --- |
| `ImageSource` | `getMetadata`, `getImage` | WMS |
| `TileSource` | `getMetadata`, `getTile`, `getTileData` | WMTS, OGC API Tiles |
| `VectorSource` | `getMetadata`, `getSchema`, `getFeatures` | WFS, OGC API Features |
| Coverage source | `getMetadata`, `getCoverage` | WCS, OGC API Coverages |
| Catalog source | `getMetadata`, `search` | CSW |
| EDR source | `getLandingPage`, `getCollections`, `query` | OGC API EDR |

## deck.gl integration

Visual service sources work through one generic `SourceLayer`:

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {WMTSSourceLoader} from '@loaders.gl/wms';

const layer = new SourceLayer({
  id: 'satellite',
  data: wmtsUrl,
  loaders: [WMTSSourceLoader],
  sourceOptions: {wmts: {layer: layerId, tileMatrixSet: matrixSetId}}
});
```

WMS, WMTS, WFS, and OGC API Features map naturally to visual source contracts. Catalog, EDR, and
analytical coverage outputs require an application choice before rendering: select a catalog
record, EDR representation, raster band, color ramp, and NoData policy first.

## Shared service infrastructure

- [`ServiceRuntime`](/docs/modules/wms/services/universal-service-runtime) adds loader selection, source caching,
  retries, cancellation, shared headers, and telemetry.
- [`CapabilityGraph`](/docs/modules/wms/services/capability-discovery) records relationships among discovered
  endpoints and ranks them by type, format, CRS, latency, and quality.
- [CRS and tile-grid utilities](/docs/modules/wms/api-reference/crs-and-tile-grids) normalize identifiers, axis
  order, matrix sets, ArcGIS LODs, and antimeridian-sensitive metadata.
- [Service capabilities](/docs/modules/wms/api-reference/service-capabilities) provide a provider-neutral metadata
  shape while concrete sources retain provider-specific details.

These pieces are optional. If an endpoint and protocol are already known, creating the concrete
source directly remains the smallest API.

## Authentication and errors

All sources inherit loaders.gl fetch configuration. Applications can provide headers, credentials,
request middleware, proxies, and custom fetch functions without protocol-specific wrappers.
Abort signals are accepted by data requests that may be long-running.

Pass exact-origin query or bearer credentials through `core.credentials`, or configure them once
on `ServiceRuntime`. They are propagated to the concrete source and redacted from runtime telemetry
and normalized errors. See the [authentication guide](/docs/developer-guide/authentication).

Protocol errors are checked before parsing. WMS and related XML service exceptions use dedicated
error parsers; focused adapters report the operation and HTTP status.

## Testing and conformance policy

Fast tests use deterministic fixtures and block public-network access. Fixtures cover protocol
versions, namespace variations, axis order, matrix grids, streaming chunk boundaries, and provider
metadata. Live examples are demonstrations, not CI dependencies.

loaders.gl documents its actual implemented subset on each service page. Optional standards
features are marked pass-through or unsupported instead of being implied by the existence of a
capabilities parser.

## Attributions

`@loaders.gl/wms` uses `@loaders.gl/xml` for XML parsing. Some test fixtures originated from
OpenLayers and retain their licenses in the test data; no OpenLayers runtime code is included in the
published module.
