# @loaders.gl/ogc

`@loaders.gl/ogc` groups open geospatial service protocols and STAC catalog sources. The format subpaths export metadata loaders for asynchronous APIs. Use [WMS and OGC API sources](https://loaders.gl/docs/modules/ogc/wms.md) or [STAC sources](https://loaders.gl/docs/modules/ogc/stac.md) for format-specific APIs and explicit parser entry points.

```
import {WMSCapabilitiesLoader} from '@loaders.gl/ogc/wms';

import {STACLoader} from '@loaders.gl/ogc/stac';

import {WMSLoader} from '@loaders.gl/ogc/wms/bundled';
```

WMS, WMTS, WFS, WCS, CSW, GML, and OGC API Features, Tiles, EDR, and Coverages live here. Provider credentials remain in [`@loaders.gl/services`](https://loaders.gl/docs/modules/services.md), and ArcGIS has its own [`@loaders.gl/arcgis`](https://loaders.gl/docs/modules/arcgis.md) package.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/ogc/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [STAC](https://loaders.gl/docs/modules/ogc/stac/formats/stac.md)
* [CSW - Catalogue Service for the Web](https://loaders.gl/docs/modules/ogc/wms/formats/csw.md)
* [GML - Geography Markup Language](https://loaders.gl/docs/modules/ogc/wms/formats/gml.md)
* [OWS Context](https://loaders.gl/docs/modules/ogc/wms/formats/ows-context.md)
* [WCS - Web Coverage Service](https://loaders.gl/docs/modules/ogc/wms/formats/wcs.md)
* [WFS - Web Feature Service](https://loaders.gl/docs/modules/ogc/wms/formats/wfs.md)
* [WMC - Web Map Context](https://loaders.gl/docs/modules/ogc/wms/formats/wmc.md)
* [WMS](https://loaders.gl/docs/modules/ogc/wms/formats/wms.md)
* [WMTS](https://loaders.gl/docs/modules/ogc/wms/formats/wmts.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->16<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                   | Import subpath                                         |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [![](/images/format-logos/ogc-mark.svg)OGCCSW](https://loaders.gl/docs/modules/ogc/wms/formats/csw.md)   | `@loaders.gl/ogc/csw`                                  |
| [![](/images/format-logos/ogc-mark.svg)OGCCSW](https://loaders.gl/docs/modules/ogc/wms/formats/csw.md)   | `@loaders.gl/ogc/csw/bundled`                          |
| [![](/images/format-logos/ogc-mark.svg)OGCGML](https://loaders.gl/docs/modules/ogc/wms/formats/gml.md)   | `@loaders.gl/ogc/gml`                                  |
| [![](/images/format-logos/ogc-mark.svg)OGCGML](https://loaders.gl/docs/modules/ogc/wms/formats/gml.md)   | `@loaders.gl/ogc/gml-loader`                           |
| [![](/images/format-logos/ogc-mark.svg)OGCGML](https://loaders.gl/docs/modules/ogc/wms/formats/gml.md)   | `@loaders.gl/ogc/gml/bundled`                          |
| [![](/images/format-logos/stac-logo.png)STAC](https://loaders.gl/docs/modules/ogc/stac/formats/stac.md)  | `@loaders.gl/ogc/stac`                                 |
| [![](/images/format-logos/stac-logo.png)STAC](https://loaders.gl/docs/modules/ogc/stac/formats/stac.md)  | `@loaders.gl/ogc/stac-loader`                          |
| [![](/images/format-logos/stac-logo.png)STAC](https://loaders.gl/docs/modules/ogc/stac/formats/stac.md)  | `@loaders.gl/ogc/stac/bundled`                         |
| [![](/images/format-logos/ogc-mark.svg)OGCWFS](https://loaders.gl/docs/modules/ogc/wms/formats/wfs.md)   | `@loaders.gl/ogc/wfs`                                  |
| [![](/images/format-logos/ogc-mark.svg)OGCWFS](https://loaders.gl/docs/modules/ogc/wms/formats/wfs.md)   | `@loaders.gl/ogc/wfs/bundled`                          |
| [![](/images/format-logos/ogc-mark.svg)OGCWMS](https://loaders.gl/docs/modules/ogc/wms/formats/wms.md)   | `@loaders.gl/ogc/wms`                                  |
| [![](/images/format-logos/ogc-mark.svg)OGCWMS](https://loaders.gl/docs/modules/ogc/wms/formats/wms.md)   | `@loaders.gl/ogc/wms/api`                              |
| [![](/images/format-logos/ogc-mark.svg)OGCWMS](https://loaders.gl/docs/modules/ogc/wms/formats/wms.md)   | `@loaders.gl/ogc/wms/bundled`                          |
| [![](/images/format-logos/ogc-mark.svg)OGCWMTS](https://loaders.gl/docs/modules/ogc/wms/formats/wmts.md) | `@loaders.gl/ogc/wmts`                                 |
| [![](/images/format-logos/ogc-mark.svg)OGCWMTS](https://loaders.gl/docs/modules/ogc/wms/formats/wmts.md) | `@loaders.gl/ogc/wmts-capabilities-loader-with-parser` |
| [![](/images/format-logos/ogc-mark.svg)OGCWMTS](https://loaders.gl/docs/modules/ogc/wms/formats/wmts.md) | `@loaders.gl/ogc/wmts/bundled`                         |
