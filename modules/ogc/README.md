# @loaders.gl/ogc

OGC service protocols and STAC catalog sources.

```ts
import {WMSCapabilitiesLoader, STACSourceLoader} from '@loaders.gl/ogc';
import {WMSSourceLoader} from '@loaders.gl/ogc/wms';
import {STACSourceLoaderWithParser} from '@loaders.gl/ogc/stac/stac-source';
```

The root exposes metadata loaders. WMS, WFS, WMTS, WCS, CSW, GML, and OGC API sources live under `@loaders.gl/ogc/wms`; STAC sources live under `@loaders.gl/ogc/stac`. Parser-bearing loaders use explicit nested entry points. Provider authentication remains in `@loaders.gl/services`, and ArcGIS sources remain in `@loaders.gl/arcgis`.
