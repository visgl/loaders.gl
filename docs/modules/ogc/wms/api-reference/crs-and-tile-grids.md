---
title: CRS and tile-grid intelligence
description: Normalize service CRS identifiers and select compatible tile grids.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="wms"
  eyebrow="WMS module · coordinate systems"
  title="CRS and tile-grid intelligence"
  description="Service metadata uses many equivalent CRS spellings and tile-matrix identifiers. These helpers normalize the common cases and select a compatible grid without making assumptions about the service’s native naming."
  tone="violet"
  meta={['CRS normalization', 'Axis order', 'WMTS tile matrices']}
  links={[
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'WMS module', to: '/docs/modules/ogc/wms'},
    {label: 'WMTS capabilities', to: '/docs/modules/ogc/wms/api-reference/wmts-capability-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The service boundary"
  title="Use the service’s identifiers without guessing."
  description="Capabilities documents may list URNs, EPSG codes, CRS:84, or provider-specific matrix identifiers. The helpers provide normalized comparisons while leaving final request construction to the service metadata."
  tone="violet"
  items={[
    {label: 'Normalize', value: 'Equivalent service CRS spellings'},
    {label: 'Select', value: 'A compatible CRS from advertised values'},
    {label: 'Axis order', value: 'Common geographic and projected conventions'},
    {label: 'Tile grids', value: 'Matrix identifiers and linked CRS metadata'}
  ]}
/>

<ReferenceBoundary
  title="CRS and tile-grid reference"
  description="The sections below document the helpers and how WMS/WMTS sources use them with capabilities metadata."
  tone="violet"
/>

The WMS package exposes utilities for services that use different CRS spellings:

```js
import {normalizeServiceCRS, selectServiceCRS} from '@loaders.gl/ogc/wms/api';

normalizeServiceCRS('urn:ogc:def:crs:EPSG::3857'); // 'EPSG:3857'
normalizeServiceCRS('urn:ogc:def:crs:OGC:1.3:CRS84'); // 'CRS:84'
normalizeServiceCRS('urn:ogc:def:crs:IAU::30100'); // 'IAU:30100'
selectServiceCRS('EPSG:3857', ['EPSG:4326', 'EPSG:3857']); // 'EPSG:3857'
```

`normalizeServiceCRS` accepts these spellings:

| Input | Result |
| --- | --- |
| `4326`, `epsg:4326`, `urn:ogc:def:crs:EPSG::4326`, `urn:x-ogc:def:crs:EPSG:4326`, `http://www.opengis.net/def/crs/EPSG/0/4326` | `EPSG:4326` |
| `CRS:84`, `OGC:CRS84`, `urn:ogc:def:crs:OGC:1.3:CRS84`, `http://www.opengis.net/def/crs/OGC/1.3/CRS84` | `CRS:84` |
| `urn:ogc:def:crs:IAU::30100`, `http://www.opengis.net/def/crs/IAU/0/30100` | `IAU:30100` |
| `urn:ogc:def:crs:ESRI::102100` | `ESRI:102100` (equivalent to Web Mercator) |
| `urn:ogc:def:crs:EPSG:6.3:4326` and other versioned identifiers | the input in upper case |

The normalizer uses `normalizeCRSIdentifier` from `@math.gl/geospatial/crs`. It keeps the
authority of an identifier: an IAU or ESRI code never becomes an EPSG code. A versioned identifier
does not compare equal to the unversioned code. `CRS:84` and `EPSG:4326` are not equivalent.

`WMTSImageTileSource` uses these rules when capabilities list multiple linked tile matrix sets.
Set `wmts.crs` to select the compatible matrix set, and the source uses the matrix's declared
identifier (for example `L04`) rather than assuming that a zoom level is its identifier.

`getServiceCRSAxisOrder` returns the authority axis order of a CRS on the service wire. WMS 1.3.0
`BBOX`, WMTS `TopLeftCorner`, WFS 1.1.0/2.0.0 `BBOX`, the OGC API Features `bbox` for a
`bbox-crs`, and an OGC TileMatrixSet `pointOfOrigin` without `orderedAxes` use this order.
Decoded response geometry is not swapped. For example, WFS GML coordinates keep the order of the
response.

- `yx` for a small built-in table of EPSG CRSs. The table has EPSG geographic 2D CRSs
  (latitude first), for example EPSG:4326, EPSG:4258, EPSG:4269 and EPSG:4283. It also has
  projected CRSs with northing first: EPSG:2180, EPSG:2193, EPSG:3006, EPSG:3034, EPSG:3035 and
  EPSG:31466-31469. The source of each entry is its EPSG registry record.
- A versioned EPSG identifier, such as `urn:ogc:def:crs:EPSG:6.3:4326`, uses the order and the
  unit of its code.
- `xy` for all CRS84 forms, all other EPSG codes, other authorities, and the legacy
  `http://www.opengis.net/gml/srs/epsg.xml#4326` form (longitude first by convention).

```js
import {getServiceCRSAxisOrder} from '@loaders.gl/ogc/wms/api';

getServiceCRSAxisOrder('EPSG:4258'); // 'yx'
getServiceCRSAxisOrder('urn:ogc:def:crs:OGC:1.3:CRS84'); // 'xy'
getServiceCRSAxisOrder('EPSG:4326', {axisOrder: 'xy'}); // 'xy'
```

The table is not complete. If a service uses a CRS that is not in the table, set the `axisOrder`
option of the source: `wms.axisOrder`, `wmts.axisOrder`, `wfs.axisOrder` or
`'ogc-api'.axisOrder`. The option applies to every CRS of that source. For OGC API Tiles, it
also overrides the declared `orderedAxes`. `convertOGCTileMatrixSetToTileGrid` takes the same
`axisOrder` option. A later math.gl authority
axis-order query will replace the built-in table.

Built-in units: all CRS84 forms and the geographic CRSs of the table use degrees. Web Mercator
uses meters. The projected CRSs of the table have no built-in unit: set `metersPerUnit`.

The shared `VectorSource` contract keeps application geometry and bounding boxes in canonical `xy`
order. For feature queries, pass `requestCrs` when the input bounding box uses a CRS different from
the output `crs`; WFS and OGC API adapters translate the canonical values to their wire-axis rules.

For a cross-format explanation of geometry, addressing, and availability, see [Tile matrices and tile matrix sets](/docs/developer-guide/tile-matrices).
