# WMTS - Web Map Tiling Service

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- *[`@loaders.gl/wms`](/docs/modules/wms)*
- *[Wikipedia article](https://en.wikipedia.org/wiki/Web_Map_Tile_Service)*

WmTS (Web Map Tile Service) is a standardized protocol for serving pre-rendered or run-time computed georeferenced **map tiles** over the Internet.

The specification was developed and first published by the Open Geospatial Consortium in 2010.

## Characteristics

WMTS is not a single file format but rather a protocol, specifying a number of required and optional requests. Some requests return binary images, and some return metadata formatted as XML (text) responses. The XML responses are fairly detailed and some variations exists, so when working with WMTS it is typically useful to have access to pre-tested parsers for each response type.

## Request Types

The WMTS standard specifies a number of "request types" that a standards-compliant WMTS server should support. loaders.gl provides loaders for all WMTS request responses:

| **WMTS Request**   | **Response Loader**      | **Description**                                                                                                                                                                                                                      |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GetCapabilities`  | `WMTSCapabilitiesLoader` | Returns parameters about the WMTS (such as map image format and WMTS version compatibility) and the available layers (map bounding box, coordinate reference systems, URI of the data and whether the layer is mostly opaque or not) |
| `GetTile`          | `ImageLoader`            | returns a map image. Parameters include: width and height of the map, coordinate reference system, rendering style, image format                                                                                                     |
| `GetFeatureInfo`   | `WMTSFeatureInfoLoader`  | if a layer is marked as 'queryable' then you can request data about a coordinate of the map image.                                                                                                                                   |
| `GetLegendGraphic` | `ImageLoader`            | An image of the map's legend, giving a visual guide to map elements.                                                                                                                                                                 |

Note that only the `GetCapabilities` and `GetTile` request types are are required to be supported by a WMTS server. The response to `GetCapabilities` contains information about which request types are supported

## Request Formats

The WMTS standard defines three different ways to send request parameters to the server.

| Format          | Constant    | Supported | Description          |
| --------------- | ----------- | --------- | -------------------- |
| Key-Value Pairs | `'kvp'`     | Y         | Query parameters     |
| RESTful         | `'restful'` | N         | URL path             |
| SOAP            | `'soap'`    | N         | XML encoded payloads |

## Map images

A WMTS server usually serves the map in a bitmap format, e.g. PNG, GIF, JPEG. In addition, vector graphics can be included, such as points, lines, curves and text, expressed in SVG or WebCGM format. The MIME types of the `GetTile` request can be inspected in the response to the `GetCapabilities` request.

## Layers

Unlike WMS, there is no specified way to request a server to combine and return a map tile with information coming from more than one layer in a single retrieval. WMTS clients that want to show a combination of layers must make independent requests for the layer tiles and then combine or overlay the responses. Also, bounding boxes and scales of these WMTS tiles are constrained to a discrete set of values.
