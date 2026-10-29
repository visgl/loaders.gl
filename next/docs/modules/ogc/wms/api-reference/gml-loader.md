WMS module · geospatial loader

![](/next/images/format-logos/ogc-mark.svg)OGCGML

# GMLLoader

Parse the practical feature and geometry subset of OGC Geography Markup Language into Arrow tables with GeoArrow geometry, including incremental feature batches for large responses.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[XMLLoader](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml/api-reference/xml-loader.md)[GIS category](https://loaders.gl/next/docs/specifications/category-gis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-gis.md)

What it reads

## Extract useful features from an ambitious XML standard.

GML covers a very broad space. GMLLoader focuses on the common feature-collection and geometry path, with a streaming mode that emits complete features as the response arrives.

01

Input

GML feature collections and responses

02

Geometry

Points, lines, polygons, and multiparts

03

Output

Arrow feature tables or explicit GeoJSON

04

Streaming

Feature batches for large WFS responses

Detailed guide

## GMLLoader reference

The sections below document usage, parsed data, streaming behavior, options, and the supported subset.

![From-3.3](https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `GMLLoader` parses the XML-formatted response from the the [OGC](https://www.opengeospatial.org/)-standardized [GML](https://www.ogc.org/standards/wms) (Geographic Markup Language) file format into a standard geospatial feature table.

> Note that the GML standard is very ambitious and full support of the format is out of scope.

| GMLLoader         |                                                      |
| ----------------- | ---------------------------------------------------- |
| File Extension    | `.gml`                                               |
| File Type         | Text                                                 |
| File Format       | [GML](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format       | Arrow table with GeoArrow WKB geometry               |
| Decoder Type      | Synchronous                                          |
| Worker Thread     | ❌ No                                                |
| Streaming Support | Feature collections                                  |

## Usage[​](#usage "Direct link to Usage")

```
import {GMLLoader} from '@loaders.gl/ogc/wms';

import {load} from '@loaders.gl/core';



// Form a GML request

const url = `${WFS_SERVICE_URL}?REQUEST=GetFeature&...`;



const data = await load(url, GMLLoader, options);
```

## Parsed Data Format[​](#parsed-data-format "Direct link to Parsed Data Format")

The `GMLLoader` supports the standard geospatial subset of geometries (points, multipoints, lines, linestrings, polygons and multipolygons). By default, it returns `{shape: 'arrow-table', schema, data}`. Feature properties and IDs become columns and geometry uses `geoarrow.wkb`. A bare geometry becomes a one-row table; an empty result becomes an empty table. Coordinates are not reprojected, and CRS metadata is explicitly unknown (`crs: null`); this loader does not yet resolve GML `srsName` into Arrow CRS metadata.

Set `gml.shape: 'geojson'` to retain the previous FeatureCollection, bare geometry, or null result. Arrow conversion rejects properties that collide with the output `geometry` column or a feature ID's `id` column; explicit GeoJSON retains both values. The root `GMLLoader` is metadata-only (`_GMLLoader` remains an alias). Synchronous parsing uses `GMLLoaderWithParser` from `@loaders.gl/ogc/wms/gml-loader`.

For large WFS responses, the parser-bearing loader also supports incremental feature batches:

```
import {parseInBatches} from '@loaders.gl/core';

import {GMLLoader} from '@loaders.gl/ogc/wms';



for await (const batch of await parseInBatches(response.body, GMLLoader, {

  gml: {batchSize: 500}

})) {

  console.log(batch.data.numRows);

}
```

The streaming path emits complete `featureMember` / `featureMembers` features as they become available and keeps incomplete fragments buffered. Each Arrow batch infers its own property schema; heterogeneous batches can have different schemas. Bare geometries use whole-file parsing. Explicit `gml.shape: 'geojson'` returns FeatureCollection batches. WFS source output remains controlled by the WFS format option.

## Options[​](#options "Direct link to Options")

| Option                | Type                                     | Default         | Description                                           |
| --------------------- | ---------------------------------------- | --------------- | ----------------------------------------------------- |
| `gml.shape`           | `'arrow-table' \| 'geojson'`             | `'arrow-table'` | Whole-file and streaming output shape.                |
| `gml.batchSize`       | `number`                                 | `1000`          | Feature count per streaming batch.                    |
| `gml.propertyTypes`   | `Record<string, GMLPropertyType>`        | —               | XML Schema scalar types keyed by local property name. |
| `gml.transformCoords` | `(...coordinates: number[]) => number[]` | Identity        | Optional coordinate transformation.                   |
