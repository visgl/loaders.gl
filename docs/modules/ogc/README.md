---
title: OGC service sources
---

import {ModuleSubpaths} from '@site/src/components/docs/module-subpaths';


# @loaders.gl/ogc

`@loaders.gl/ogc` groups open geospatial service protocols and STAC catalog sources. The package root exports metadata loaders for asynchronous APIs. Use [WMS and OGC API sources](/docs/modules/ogc/wms) or [STAC sources](/docs/modules/ogc/stac) for format-specific APIs and explicit parser entry points.

```ts
import {WMSCapabilitiesLoader, STACLoader} from '@loaders.gl/ogc';
import {WMSLoader} from '@loaders.gl/ogc/wms';
```

WMS, WMTS, WFS, WCS, CSW, GML, and OGC API Features, Tiles, EDR, and Coverages live here. Provider credentials remain in [`@loaders.gl/services`](/docs/modules/services), and ArcGIS has its own [`@loaders.gl/arcgis`](/docs/modules/arcgis) package.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/ogc/THIRD-PARTY-NOTICES.md)
and the project-wide [Attributions and Credits](/docs/references-and-credits).


## Format guides

- [STAC](./stac/formats/stac.md)
- [CSW - Catalogue Service for the Web](./wms/formats/csw.md)
- [GML - Geography Markup Language](./wms/formats/gml.md)
- [OWS Context](./wms/formats/ows-context.md)
- [WCS - Web Coverage Service](./wms/formats/wcs.md)
- [WFS - Web Feature Service](./wms/formats/wfs.md)
- [WMC - Web Map Context](./wms/formats/wmc.md)
- [WMS](./wms/formats/wms.md)
- [WMTS](./wms/formats/wmts.md)


## Package exports

<ModuleSubpaths module="ogc" />
