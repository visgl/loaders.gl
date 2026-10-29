WMS module · coordinate systems

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# CRS and tile-grid intelligence

Service metadata uses many equivalent CRS spellings and tile-matrix identifiers. These helpers normalize the common cases and select a compatible grid without making assumptions about the service’s native naming.

[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[WMTS capabilities](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wmts-capability-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wmts-capability-loader.md)

The service boundary

## Use the service’s identifiers without guessing.

Capabilities documents may list URNs, EPSG codes, CRS:84, or provider-specific matrix identifiers. The helpers provide normalized comparisons while leaving final request construction to the service metadata.

01

Normalize

Equivalent service CRS spellings

02

Select

A compatible CRS from advertised values

03

Axis order

Common geographic and projected conventions

04

Tile grids

Matrix identifiers and linked CRS metadata

Detailed guide

## CRS and tile-grid reference

The sections below document the helpers and how WMS/WMTS sources use them with capabilities metadata.

The WMS package exposes utilities for services that use different CRS spellings:

```
import {normalizeServiceCRS, selectServiceCRS} from '@loaders.gl/ogc/wms';



normalizeServiceCRS('urn:ogc:def:crs:EPSG::3857'); // 'EPSG:3857'

selectServiceCRS('EPSG:3857', ['EPSG:4326', 'EPSG:3857']); // 'EPSG:3857'
```

`WMTSImageTileSource` uses these rules when capabilities list multiple linked tile matrix sets. Set `wmts.crs` to select the compatible matrix set, and the source uses the matrix's declared identifier (for example `L04`) rather than assuming that a zoom level is its identifier.

The axis-order helper reports the conventional service order for the common geographic CRS: `EPSG:4326` is `yx`, while `CRS:84` and projected CRSs are `xy`. Applications should still follow the individual service's capabilities when constructing coordinate arrays.

The shared `VectorSource` contract keeps application geometry and bounding boxes in canonical `xy` order. For feature queries, pass `requestCrs` when the input bounding box uses a CRS different from the output `crs`; WFS and OGC API adapters translate the canonical values to their wire-axis rules.

For a cross-format explanation of geometry, addressing, and availability, see [Tile matrices and tile matrix sets](https://loaders.gl/next/docs/developer-guide/tile-matrices.md).
