# @loaders.gl/ogc

OGC web service clients and STAC catalog sources.

Supported formats: WMS, WFS, WMTS, WCS, CSW, GML, OGC API, STAC, STAC API, XML, JSON, GeoJSON.

```ts
import {WMSCapabilitiesLoader, STACLoader} from '@loaders.gl/ogc';
import {WMSLoader} from '@loaders.gl/ogc/wms';
import {STACLoaderWithParser} from '@loaders.gl/ogc/stac-loader';
```

The root exposes metadata loaders. WMS, WFS, WMTS, WCS, CSW, GML, and OGC API sources live under `@loaders.gl/ogc/wms`; STAC sources live under `@loaders.gl/ogc/stac`. Parser-bearing loaders use explicit nested entry points. Provider authentication remains in `@loaders.gl/services`, and ArcGIS sources remain in `@loaders.gl/arcgis`.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits).
