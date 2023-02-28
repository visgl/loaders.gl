# Standards Support

## OGC Formats

| Format     | Module                   | Description |
| ---------- | ------------------------ | ----------- |
| KML        | `@loaders.gl/kml`        |
| GeoPackage | `@loaders.gl/geopackage` |
| [**GML**](./formats/gml.md) (Geographic Markup Language) format        | `@loaders.gl/wms` | an XML grammar that describes geographical features.                                                                                 |
| WKT |`@loaders.gl/wkt`
| WKB | `@loaders.gl/wkt`
| WKT-CRS | `@math.gl/proj4` | |
| 3D Tiles | `@loaders.gl/3d-tiles` | |
| I3S | `@loaders.gl/i3s` | |

Developing standards

| Format     |
| ---------- |
| GeoParquet |
| Flatgeobuf |

## OGC Web Standards

| OGC Protocols                                                    | Supported         | Description                                                                                                                          |
| ---------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [**CSW**](./formats/csw.md) (Catalog Service for the Web) protocol     | `@loaders.gl/wms` | protocol for reading a catalog of geospatial assets and services from a URL.                                                         |
| [**WMS**](./formats/wms.md) (Web Map Service) protocol                 | `@loaders.gl/wms` | protocol for serving geo-referenced map images over the internet.                                                                    |
| [**WFS**](./formats/wfs.md) (Web Feature Service) protocol             | `@loaders.gl/wms` | protocol for serving geo-referenced map features (geometries) over the internet.                                                     |
| [**WMTS**](./formats/wmts.md) (Web Map Tile Service) protocol          | `@loaders.gl/wms` | protocol for serving pre-rendered or run-time computed georeferenced map tiles over the Internet.                                    |
| [**WCS**](./formats/wcs.md) (Web Coverage Service)                     | No                | Load coverage data (e.g. geotiff images for satellite data) from a server.                                                           |
| [**WMC**](./formats/wmc.md) (Web Map Context)                          | No                | Used in WMS clients to save the configuration of maps and to load them again later. Can also be exchanged between different clients. |
| [**OWS Context**](./formats/ows-context.md) (OGC Web Services Context) | No                | Allows configured information resources to be passed between applications primarily as a collection of services.                     |


## Non-Standards

| Format     |
| --- | --- |
| Shapefile | `@loaders.gl/shapefile` 
| [**LERC**](./formats/lerc.md) (Limited Error Raster Compression) format        | `@loaders.gl/wms` | .                                                                                 |
