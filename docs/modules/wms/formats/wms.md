# WMS - Web Map Service

- *[`@loaders.gl/wms`](/docs/modules/wms)*
- *[Wikipedia article](https://en.wikipedia.org/wiki/Web_Map_Service)*

WMS (Web Map Service) is a protocol for serving geo-referenced **map images** over the internet. WMS was standardized in 1999 by the OGC (Open Geospatial Consortium).

## Characteristics

WMS is not a single file format but rather a protocol, specifying a set of requests that the server should implement. Some WMS protocol requests return binary images, and some return metadata formatted as XML text responses. 

WMS responses are typically XML encoded have a fairly detailed structure and some significant differences between versions exist, making it somewhat non-trivial to parse. Therefore when working with WMS it is typically useful to have access to well-tested parsers for each XML response type.

## Concepts

### Map images

A WMS server usually serves the map in a bitmap format, e.g. PNG, GIF, JPEG. In addition, vector graphics can be included, such as points, lines, curves and text, expressed in SVG or WebCGM format. The MIME types of the `GetMap` request can be inspected in the response to the `GetCapabilities` request.

Rendering parameters can be supported by the WMS service. Perhaps the most significant one is the `transparent` parameter that renders transparent pixels where there is no data, allowing the generated map images to be overlaid with other 

## Capabilities

## WMS Capabilities

The `GetCapabilities` request returns metadata about the WMS service. 

| XML Tag               | JSON Field           | Type       | Description                                                                                  |
| --------------------- | -------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `<Version>`           | `version?`           | `string`   | Version of the WMS service: '1.3.0', '1.1.1', '1.1.0' or '1.0.0'                             |
| `<Name>`              | `name`               | `string`   | A human readable name for the service                                                        |
| `<Title>`             | `title?`             | `string`   | A more extensive description of the service                                                  |
| `<Abstract>`          | `abstract?`          | `string`   |                                                                                              |
| `<Keyword>`           | `keywords`           | `string[]` | A set of keywords e.g. for searching services                                                |
| `<AccessConstraints>` | `accessConstraints?` | `string`   | A field of unspecified format, describes any access constraints required to use the service. |
| `<Fees>`              | `fees?`              | `string`   | A field of unspecified format, describes any fees required to use the service                |
| `<LayerLimit>`        | `layerLimit?`        | `number`   | If present, the max number of layers that can be rendered by the service                     |
| `<MaxWidth>`          | `maxWidth?`          | `number`   | If present, the widest image that can be rendered by the service                             |
| `<MaxHeight>`         | `maxHeight?`         | `number`   | If present, the tallest image that can be rendered by the service                            |
| `<Layers`             | `layers`             | `object[]` | Hierarchical list of layers.                                                                 |
| `<Requests`           | `requests`           | `object`   | Information about supported WMS requests, specifically what MIME types they can return       |
| `<Exceptions>`        | `exceptions?`        | `object`   | Information about any exceptions that the service will report (HTTP status != 2xx)           |
| `<ContactInfo>`       | N/A                  | `object`   | Information about any exceptions that the service will report (HTTP status != 2xx)           |

Layers in the `layers` field inherit many properties from their parent layers, see description of individual props for details.

| XML Tag                      | JSON Field               | Type               | Description                                                                           | Required | Inherited |
| ---------------------------- | ------------------------ | ------------------ | ------------------------------------------------------------------------------------- | -------- |
| `<Title>`                    | `title`                  | `string`           | The title is a human readable name. It is mandatory on each layer.                    | Yes      | No        |
| `<Name>`                     | `name?`                  | `string`           | Layer is renderable if it has a name. A named parent layer will render all sublayers. | No       | No        |
| `<Abstract>`                 | `abstract?`              | `string`           | A narrative description of the map layer.                                             | No       | No        |
| `<Keywords>`                 | `keywords`               | `string[]`         | A set of keywords e.g. for searching layers                                           | No       | No        |
| `<EX_GeographicBoundingBox>` | `geographicBoundingBox?` | `[[w, s], [e, n]]` | 1.3.0. Rough extents of layer data in lng/lat, for quick access w/o CRS calculations. | yes      | Yes       |
| `<LngLatBoundingBox>`        | `geographicBoundingBox?` | `[[w, s], [e, n]]` | 1.1.1 Rough extents of layer data in lng/lat, for quick access w/o CRS calculations.  | yes      | Yes       |
| `<CRS>`                      | `crs?`                   | `string[]`         | 1.3.0 Supported CRS.                                                                  | Yes      | Yes       |
| `<SRS>`                      | `crs?`                   | `string[]`         | 1.1.1 Supported CRS.                                                                  | Yes      | Yes       |
| `<BoundingBox>`              | `boundingBoxes?`         | `object[]`         | Bounding boxes in specific CRS:es                                                     |
| `<MinScale>`                 | `minScale`               | `number`           |
| `<MaxScale>`                 | `maxScale`               | `number`           |
| `<Dimensions>`               | `dimensions`             | `number`           |                                                                                       |
| `<MetadataURL>`              | `metadataURL`            |                    |                                                                                       |
| `<Attribution>`              | `attribution`            |                    |                                                                                       |
| `<Identifier>`               | `identifier`             |                    |                                                                                       |
| `<AuthorityURL>`             | `authorityURL`           |                    |                                                                                       |
| `<FeatureListURL>`           | `featureListURL`         |                    |                                                                                       |
| `<DataURL>`                  | `dataURL`                |                    |                                                                                       |
| `<Queryable>`                | `queryable?`             | `boolean`          | Whether queries can be performed on the layer                                         |
| `<Opaque>`                   | `opaque?`                | `boolean`          | `false` if layer has significant no-data areas that can be display as transparent.    |
| `<Cascaded>`                 | `cascaded?`              | `boolean`          | "WMS cascading" allows server to expose layers coming from other WMS servers          |
| `<NoSubsets>`                | `noSubsets`              | `boolean`          |
| `<FixedWith>`                | `fixedWith`              | `number`           |
| `<FixedHeight>`              | `fixedHeight`            | `number`           |
| `<Styles>`                   | `styles?`                | `unknown[]`        | A list of styles. @note not yet supported by WMSCapabilitiesLoader                    |
| `<Layers>`                   | `layers`                 | `object[]`         | Sublayers`  - these inherit crs and boundingBox (if not overridden)                   |

A bounding box in the layer `boundingBoxes` field specifies the coordinate range for data in the layer, described in a specific CRS (coordinate reference system). No data is available outside this bounding box.

| XML Tag         | JSON Field     | Type               | Description                                                                                   |
| --------------- | -------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `<CRS>`         | `crs`          | `string`           | 1.3.0 CRS indicates the Layer CRS that applies to this bounding box.                          |
| `<SRS>`         | `crs`          | `string`           | 1.1.1 CRS indicates the Layer CRS that applies to this bounding box.                          |
| `<BoundingBox>` | `boundingBox`  | `[[w, s], [e, n]]` | indicates the limits of the bounding box using the axis units and order of the specified CRS. |
| `<resx>`        | `xResolution?` | `number`           | Spatial horizontal resolution of data in same units as bounding box                           |
| `<resy>`        | `yResolution?` | `number`           | Spatial vertical resolution of data in same units as bounding box                             |

Remarks:
- The above table is not intended to be an exhaustive description of OGC WMS Capabilities XML. 
- Some XML tags have additional nested tags or properties not described here, please refer directly to the OGC WMS standard if such details matter.
- The "JSON Field" in the tables below is not part of the OGC WMS standard. It describes the JSON representation that the loaders.gl `WMSCapabilitiesLoader` outputs, and the type field represents JSON types. 
- The JSON representation is simpler, but similar to, the source XML. (camelCase instead of PascalCase etc).

### Map Layers

A WMS service defines a number of **layers** representing data that can be rendered. A list of layers must be specified in the `GetMap` request. If no layers are requested, no map image will be produced and an error will be generated by the WMS service.

The `GetCapabilities` request returns a list of valid layers and metadata about them such as their name and description, which `crs` or coordinate reference systems they support, their bounding box, any sub layers etc.

Also note that WMS layers are organized in a hierarchy. 
- Only named layers (with `name` property) are renderable.
- A named parent layer will render all renderable sublayers.
- Sublayers inherit properties from the parent layers (refer to table above to see exactly which properties are inherited).
- Layer intheritance is often used to reduce the size of the `GetCapabilities` XML response payload, as verbose information about bounding boxes, supported CRS etc can be specified once on a parent layer.

Without any apriori knowledge about a WMS server, the GetCapabilities request is the only way to discover valid layer names. Not that on the `GetCapabilities` request is sometimes slow (order of tens of seconds), meaning that it can take some time to auto-discover a valid layer name and then request a map with that layer. The `GetMap` request is often significantly faster than `GetCapabilities`. 

## WMS Requests

The WMS standard specifies protocol defined as a number of "request types" that a standards-compliant WMS server should support. 

| **WMS Request**    | **loaders.gl support**                         | **Description**                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GetCapabilities`  | [`WMSCapabilitiesLoader`][capabilities_loader] | Returns WMS metadata (such as map image format and WMS version compatibility) and the available layers (map bounding box, coordinate reference systems, URI of the data and whether the layer is mostly opaque or not) |
| `GetMap`           | `ImageLoader`][image_loader]                   | returns a map image. Parameters include: width and height of the map, coordinate reference system, rendering style, image format                                                                                       |
| `GetFeatureInfo`   | `WMSFeatureInfoLoader`][feature_info_loader]   | if a layer is marked as 'queryable' then you can request data about a coordinate of the map image.                                                                                                                     |
| `DescribeLayer`    |                                                | gets feature types of the specified layer or layers, which can be further described using WFS or WCS requests. (Styled Layer Descriptor (SLD) Profile of WMS).                                                         |
| `GetLegendGraphic` | `ImageLoader`][image_loader]                   | An image of the map's legend, giving a visual guide to map elements.                                                                                                                                                   |
| Exceptions         | `WMSErrorLoader`                               | Parses an XML encoded WMS error response from any malformed request.                                                                                                                                                   |

Remarks:
- Information about which request types are supported is available in the response to `GetCapabilities` request.
- Note that only the `GetCapabilities` and `GetMap` request types are are required to be supported by a WMS server. 

[capabilities_loader]: /docs/modules/wms/api-reference/wms-capabilities-loader
[feature_info_loader]: /docs/modules/wms/api-reference/wms-feature-info-loader
[image_loader]: /docs/modules/image/api-reference/image_loader

## Coordinate Reference Systems



## WMS Protocol Versions

Several revisions of the WMS standard have been published by the OGC. It is notable that there are some breaking, non-backwards compatible changes. Taking care of these differences on behalf of the application is normally goal of libraries that provide WMS support. 

#### v1.3.0

Version 1.3.0 of the WMS standard was released in January 2004

- Use `CRS` instead of `SRS` parameter for 1.3.0
- The order of parameters for BBOX (in v1.3.0 only) depends on whether the CRS definition has flipped axes. You will see this in the `GetCapabilities` request at 1.3.0 - the response should show the flipped axes.
  + `BBOX=xmin,ymin,xmax,ymax NON-FLIPPED`
  + `BBOX=ymin,xmin,ymax,xmax FLIPPED`
  + `EPSG:4326` needs to have flipped axes. `4326 1 WGS 84 Latitude North Longitude East`

- `EPSG:4326` is wrongly defined in v1.1.1 as having long/lat coordinate axes. In WMS 1.3.0 the correct axes lat/long are used. 
- `CRS:84` was introduced with the publication of the WMS 1.3.0 specification, to overcome the breaking change of `EPSG:4326` in WMS 1.1.1 
- `CRS:84` is defined by OGC as having the same datum as `EPSG:4326` (that is the World Geodetic System 1984 datum ~ `EPSG::6326`) but axis order of long/lat.

The above information is mainly based on the following [stackexchange](https://gis.stackexchange.com/questions/23347/getmap-wms-1-1-1-vs-1-3-0) notes.

#### v1.1.1

Released in January 2002

- Use SRS instead of CRS parameter for 1.1.1
- In WMS 1.1.1 EPSG:4326 is wrongly defined as having long/lat coordinate axes. See v1.3.0 documentation for details.

#### v1.1.0

Released in June 2001

> Not tested / not officially supported.

#### v1.0.0

Released in April 2000. 

> Not tested / not officially supported.


## Servers

A number of commercial and open services implement WMS support

GeoServer is a major open source server with support for serving WMS images.

### Vendor parameters

A specific server implementation often supports additional vendor specific parameters, e.g [GeoServer](https://docs.geoserver.org/2.22.x/en/user/services/wms/vendor.html#wms-vendor-parameters)


## Example Services

There are a number of public services

 | Name                                                                                                                                       | Service URL                                                      | Description                                                                                                                                                                                                   |
 | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 | [OpenStreetMap WMS](https://www.terrestris.de/en/openstreetmap-wms/)                                                                       | https://ows.terrestris.de/osm/service                            | OpenStreetMap rendered, updated weekly, covering the entire globe. [Copyright OpenStreetMap](https://www.openstreetmap.org/copyright).                                                                        |
 | [NOAA Composite Reflectivity WMS](https://opengeo.ncep.noaa.gov/geoserver/www/index.html)                                                  | https://opengeo.ncep.noaa.gov/geoserver/conus/conus_cref_qcd/ows | Radar precipitation data covering the contiguous US. Quality Controlled 1km x 1km CONUS Radar Composite Reflectivity. This data is provided Multi-Radar-Multi-Sensor (MRMS) algorithm.                        |
 | [NASA Global Imagery Browse Services for EOSDIS](https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs/) | https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi        | Over 1,000 NASA satellite imagery products, covering every part of the world. Most imagery is updated daily—available within a few hours after satellite observation, and some products span almost 30 years. |
