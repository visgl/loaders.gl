---
title: OGC API services
description: Use focused HTTP source adapters for OGC API Features, Tiles, Coverages, and EDR resources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC API services"
  title="Use the service path that matches the data."
  description="The OGC API family exposes linked JSON resources and focused HTTP operations. loaders.gl provides small source adapters for the common read paths, with the protocol boundaries kept visible."
  tone="cyan"
  meta={['Features', 'Tiles and coverages', 'EDR observations']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Service discovery', to: '/docs/modules/wms/services/capability-discovery'}
  ]}
/>

<DocOrientation
  eyebrow="A focused service client"
  title="Discover, request, and keep the response shape explicit."
  description="Each OGC API source follows the links and operations it understands, then returns a documented result. Applications can add service-specific parameters without adopting a universal abstraction."
  tone="cyan"
  items={[
    {label: 'Features', value: 'Collections and items with bounding boxes, CRS, and paging links.'},
    {label: 'Tiles', value: 'Known tile links and templates returned as raw tile bytes.'},
    {label: 'Coverages', value: 'Collection subsets returned as JSON or binary coverage data.'},
    {label: 'EDR', value: 'Position, area, trajectory, corridor, cube, and radius queries.'}
  ]}
/>

<ReferenceBoundary
  title="OGC API service details"
  description="The reference below compares the supported APIs, source loaders, response paths, and intentional conformance boundaries."
  tone="cyan"
/>

The OGC API family replaces monolithic XML web-service protocols with linked JSON resources and
focused HTTP APIs. `@loaders.gl/wms` provides deliberately small, interoperable adapters for the
common read paths. They are useful compatibility clients, not claims of complete conformance to
every optional OGC API building block.

## Family overview

| API | Source loader | Discovery | Data path | Output | Scope |
| --- | --- | --- | --- | --- | --- |
| OGC API Features | `OGCAPIFeaturesSourceLoader` | Landing page and collections | Collection items with bbox and CRS | GeoJSON, binary, Arrow | Minimal read client |
| OGC API Tiles | `OGCAPITilesSourceLoader` | Landing-page tile link | Explicit tile template | Raw tile bytes | Minimal template client |
| OGC API Coverages | `OGCAPICoveragesSourceLoader` | Landing page and collections | Collection coverage with subsets | JSON object or binary bytes | Minimal read client |
| OGC API EDR | `OGCAPIEDRSourceLoader` | Landing page and collections | Six spatiotemporal query shapes | JSON object or binary bytes | Focused query client |

All four sources support standard loaders.gl fetch options for headers, credentials, proxies,
cancellation, and custom transports.

## OGC API Features

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing page | Supported | `getLandingPage()` returns linked service metadata |
| Collections | Supported | `getCollections()` returns advertised collection descriptions |
| Collection metadata | Supported | Normalizes title, description, CRS, and first spatial extent |
| Items request | Supported | Requests `/collections/{id}/items` |
| Bounding box | Supported | Sends the standard `bbox` parameter |
| Output CRS | Supported | Sends the requested `crs` parameter |
| GeoJSON | Supported | Validates a FeatureCollection response |
| Binary and Arrow | Supported | Converts through standard vector-source outputs |
| Paging links | Application controlled | Returned pages are not traversed automatically |
| CQL2 and advanced filters | Not normalized | Use service parameters or a custom request |
| Transactions | Not supported | Read-only source |
| deck.gl | First class | Implements `VectorSource` and works with `SourceLayer` |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPIFeaturesSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(
  'https://demo.ldproxy.net/daraa',
  [OGCAPIFeaturesSourceLoader],
  {'ogc-api': {collectionId: 'VegetationSrf'}}
);

const features = await source.getFeatures({
  layers: ['VegetationSrf'],
  boundingBox: [[36.0, 32.5], [36.2, 32.7]],
  format: 'arrow'
});
```

## OGC API Tiles

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing-page metadata | Supported | Reads title and advertised tileset media type |
| Explicit tile template | Required | Configure `ogc-api.tileTemplate` |
| OGC placeholders | Supported | `{tileMatrix}`, `{tileRow}`, `{tileCol}` |
| XYZ placeholders | Supported | `{z}`, `{y}`, `{x}` |
| Tile retrieval | Supported | `getTile()` returns the original `ArrayBuffer` |
| Matrix-set negotiation | Not implemented | Use WMTS for capability-driven grid selection |
| Tile decoding | Not automatic | Parse bytes with the loader matching the advertised media type |
| deck.gl | Foundation only | The generic tile contract is present; callers must provide the appropriate decoded tile type |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPITilesSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(landingPageUrl, [OGCAPITilesSourceLoader], {
  'ogc-api': {
    tileTemplate: 'https://example.com/tiles/{tileMatrix}/{tileRow}/{tileCol}.png'
  }
});

const tileBytes = await source.getTile({z: 3, x: 4, y: 5});
```

## OGC API Coverages

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing page | Supported | `getLandingPage()` |
| Collections | Supported | `getCollections()` |
| Collection coverage | Supported | Requests `/collections/{id}/coverage` |
| Bounding box | Supported | Sends `bbox` |
| Dimension subsets | Supported | Sends repeated `subset` parameters |
| Time selection | Supported | Sends `datetime` |
| Format negotiation | Supported | Sends `f` and an `Accept` header |
| JSON representations | Supported | Returned as parsed objects |
| Binary representations | Preserved | Returned as `ArrayBuffer` |
| Coverage decoding | Application controlled | Pass binary output to GeoTIFF, LERC, or another appropriate loader |
| Processing and visualization | Not provided | Values are not resampled or colorized implicitly |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPICoveragesSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(landingPageUrl, [OGCAPICoveragesSourceLoader], {
  'ogc-api-coverages': {collectionId: 'temperature'}
});

const coverage = await source.getCoverage({
  bbox: [-10, 40, 10, 50],
  subset: ['Lat(40,50)'],
  datetime: '2025-01-01/2025-01-31',
  format: 'application/json'
});
```

## OGC API EDR

EDR—Environmental Data Retrieval—queries multidimensional observations by space, time, vertical
level, and parameter.

| Capability | Support | Behavior |
| --- | --- | --- |
| Landing page and collections | Supported | Common OGC API discovery methods |
| Position query | Supported | Point observations |
| Radius query | Supported | Observations around a position |
| Area query | Supported | Polygon or bounding-area observations |
| Cube query | Supported | Multidimensional bounding volume |
| Trajectory query | Supported | Observations along a path |
| Corridor query | Supported | Observations in a buffered path |
| Time, vertical, parameter, and CRS controls | Supported | Standard query parameters are generated |
| GeoJSON and CoverageJSON | Supported | JSON media types are returned as objects |
| Binary representations | Preserved | Non-JSON responses are returned as `ArrayBuffer` |
| Domain-specific interpretation | Application controlled | Unit conversion and scientific analysis remain explicit |
| deck.gl | Not direct | Convert the selected response representation into a visual source first |

```ts
import {createDataSource} from '@loaders.gl/core';
import {OGCAPIEDRSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(edrUrl, [OGCAPIEDRSourceLoader], {
  'ogc-api-edr': {collectionId: 'weather'}
});

const observations = await source.query({
  queryType: 'position',
  coords: 'POINT(10 20)',
  datetime: '2025-01-01',
  parameterName: ['temperature', 'wind'],
  format: 'application/geo+json'
});
```

## Choosing OGC API or classic OGC Web Services

| Need | Prefer |
| --- | --- |
| Broad server compatibility and mature map rendering | WMS or WMTS |
| High-volume GML feature streaming | WFS |
| A straightforward GeoJSON collection endpoint | OGC API Features |
| Capability-driven tiled imagery with complex matrix sets | WMTS |
| A known modern tile template | OGC API Tiles |
| Established coverage servers and LERC decoding | WCS |
| A modern JSON coverage endpoint | OGC API Coverages |
| Environmental position, area, trajectory, or corridor queries | OGC API EDR |

## Scope boundary

The adapters intentionally avoid implementing optional conformance classes merely to check boxes.
Advanced CQL2 filters, transactions, schema extensions, process execution, and provider-specific
extensions should be added only when real service interoperability requires them. Standard fetch
APIs remain available for those escape hatches.

For a live Features endpoint, see the [ldproxy Daraa demonstration](https://demo.ldproxy.net/daraa).
Live services are not used by CI; deterministic repository fixtures remain the conformance source
of truth.
