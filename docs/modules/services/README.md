---
title: Geospatial services
---

# @loaders.gl/services

Service authentication presets and geospatial service sources live in one package with independent subpaths.

```ts
import {MapboxAuthentication} from '@loaders.gl/services';
import {WMSSourceLoader, WMSCapabilitiesLoader} from '@loaders.gl/services/wms';
import {STACSourceLoader} from '@loaders.gl/services/stac';
```

The package root contains provider authentication presets for Mapbox, Google Maps, and Cesium ion. Import WMS, WFS, WMTS, CSW, OGC API, and GML functionality from `@loaders.gl/services/wms`; import STAC sources from `@loaders.gl/services/stac`. Parser implementations are available from their explicit subpaths, such as `@loaders.gl/services/wms/gml-loader` and `@loaders.gl/services/stac/stac-source`.

ArcGIS sources and credentials remain in [@loaders.gl/arcgis](../arcgis/README.md). See the [authentication guide](../../developer-guide/authentication.md), the [WMS guide](./wms/README.md), and the [STAC guide](./stac/README.md).
