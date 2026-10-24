---
title: OGC service sources
---

# @loaders.gl/ogc

`@loaders.gl/ogc` groups open geospatial service protocols and STAC catalog sources. The package root exports metadata loaders for asynchronous APIs. Use [WMS and OGC API sources](/docs/modules/ogc/wms) or [STAC sources](/docs/modules/ogc/stac) for format-specific APIs and explicit parser entry points.

```ts
import {WMSCapabilitiesLoader, STACSourceLoader} from '@loaders.gl/ogc';
import {WMSSourceLoader} from '@loaders.gl/ogc/wms';
```

WMS, WMTS, WFS, WCS, CSW, GML, and OGC API Features, Tiles, EDR, and Coverages live here. Provider credentials remain in [`@loaders.gl/services`](/docs/modules/services), and ArcGIS has its own [`@loaders.gl/arcgis`](/docs/modules/arcgis) package.
