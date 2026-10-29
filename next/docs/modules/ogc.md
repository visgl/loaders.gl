# @loaders.gl/ogc

`@loaders.gl/ogc` groups open geospatial service protocols and STAC catalog sources. The package root exports metadata loaders for asynchronous APIs. Use [WMS and OGC API sources](https://loaders.gl/next/docs/modules/ogc/wms.md) or [STAC sources](https://loaders.gl/next/docs/modules/ogc/stac.md) for format-specific APIs and explicit parser entry points.

```
import {WMSCapabilitiesLoader, STACSourceLoader} from '@loaders.gl/ogc';

import {WMSSourceLoader} from '@loaders.gl/ogc/wms';
```

WMS, WMTS, WFS, WCS, CSW, GML, and OGC API Features, Tiles, EDR, and Coverages live here. Provider credentials remain in [`@loaders.gl/services`](https://loaders.gl/next/docs/modules/services.md), and ArcGIS has its own [`@loaders.gl/arcgis`](https://loaders.gl/next/docs/modules/arcgis.md) package.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/ogc/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
