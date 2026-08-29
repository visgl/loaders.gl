---
title: CRS and tile-grid intelligence
description: Normalize service CRS identifiers and select compatible tile grids.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WMS module · coordinate systems"
  title="CRS and tile-grid intelligence"
  description="Service metadata uses many equivalent CRS spellings and tile-matrix identifiers. These helpers normalize the common cases and select a compatible grid without making assumptions about the service’s native naming."
  tone="violet"
  meta={['CRS normalization', 'Axis order', 'WMTS tile matrices']}
  links={[
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WMTS capabilities', to: '/docs/modules/wms/api-reference/wmts-capability-loader'}
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
import {normalizeServiceCRS, selectServiceCRS} from '@loaders.gl/wms';

normalizeServiceCRS('urn:ogc:def:crs:EPSG::3857'); // 'EPSG:3857'
selectServiceCRS('EPSG:3857', ['EPSG:4326', 'EPSG:3857']); // 'EPSG:3857'
```

`WMTSImageTileSource` uses these rules when capabilities list multiple linked tile matrix sets.
Set `wmts.crs` to select the compatible matrix set, and the source uses the matrix's declared
identifier (for example `L04`) rather than assuming that a zoom level is its identifier.

The axis-order helper reports the conventional service order for the common geographic CRS:
`EPSG:4326` is `yx`, while `CRS:84` and projected CRSs are `xy`. Applications should still follow
the individual service's capabilities when constructing coordinate arrays.
