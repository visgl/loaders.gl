# CRS and tile-grid intelligence

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
