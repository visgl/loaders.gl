OGC feature encoding

![](/next/images/format-logos/ogc-mark.svg)OGCGML

# Read structured features from XML without guessing their geometry.

GML is an extensible XML grammar rather than one fixed schema. loaders.gl focuses on the feature and geometry subset used in production WFS responses and can emit features incrementally as the document arrives.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[WFS format](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md)[XML module](https://loaders.gl/next/docs/modules/xml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/xml.md)

The GML parsing path

## Frame feature members. Normalize geometry. Preserve unknown properties.

The parser follows XML structure instead of searching text with regular expressions. Applications can supply known scalar types while retaining unrecognized application-schema content.

01

Input

GML feature collection or WFS response

02

Parse

Namespaces, feature members, and coordinate encodings

03

Normalize

Points, lines, polygons, and multiparts

04

Stream

Feature batches for large XML responses

GML is the OGC XML grammar for geographical features. loaders.gl focuses on the feature and geometry subset encountered in production WFS responses, with incremental parsing for large collections.

Detailed guide

## GML grammar and parser details

The reference below covers supported geometry encodings, CRS metadata, streaming behavior, scalar type hints, and the boundary between GML and WFS.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                                           | Support          | Notes                                                                                                                   |
| ---------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GML 2 feature members                                | ✅ Supported     | Common WFS feature collection structures and geometry properties                                                        |
| GML 3 / 3.2 feature members                          | ✅ Supported     | Namespace-prefix independent parsing                                                                                    |
| Empty feature collections                            | ✅ Supported     | Recognized as collections, including terminal paging responses                                                          |
| WFS 2.0 counts and paging links                      | ✅ Supported     | Whole-document parsing retains `numberMatched`, `numberReturned`, `next`, and `previous`; unknown totals remain unknown |
| Point and MultiPoint                                 | ✅ Supported     | GML 2 and GML 3 coordinate encodings                                                                                    |
| LineString, Curve, and multi-line geometry           | ✅ Supported     | Segment coordinates are normalized to GeoJSON-compatible lines                                                          |
| Polygon, Surface, and multi-polygon geometry         | ✅ Supported     | Exterior and interior rings are preserved                                                                               |
| `coord` / `coordinates`                              | ✅ Supported     | Legacy GML 2 coordinate encodings                                                                                       |
| `pos` / `posList`                                    | ✅ Supported     | Dimensional GML 3 coordinate encodings                                                                                  |
| CRS identifiers                                      | ✅ Preserved     | `srsName` is read; reprojection is not silently applied by the parser                                                   |
| Axis order                                           | ⚠️ Service-aware | WFS source logic handles known CRS axis-order rules                                                                     |
| Streaming                                            | ✅ Supported     | `parseInBatches` emits collections as feature members arrive                                                            |
| Schema-aware scalar properties                       | ✅ Supported     | Supply string, boolean, integer, number, date, and date-time hints                                                      |
| GeoJSON output                                       | ✅ Supported     | Default geospatial representation                                                                                       |
| Binary and Arrow output                              | ✅ Through WFS   | `WFSSourceLoader` converts parsed GML to standard vector outputs                                                        |
| Arbitrary GML application schemas                    | ⚠️ Best effort   | Unknown XML properties are preserved instead of guessed                                                                 |
| Topologies, solids, and every ISO geometry primitive | ❌ Not supported | Outside the practical WFS feature subset                                                                                |

## Parse a document[​](#parse-a-document "Direct link to Parse a document")

The package root exports metadata-only loaders; async core APIs preload the parser automatically:

```
import {load} from '@loaders.gl/core';

import {GMLLoader} from '@loaders.gl/ogc/wms';



const table = await load('features.gml', GMLLoader);

console.log(table.data.numRows);
```

## Stream a large response[​](#stream-a-large-response "Direct link to Stream a large response")

```
import {loadInBatches} from '@loaders.gl/core';

import {GMLLoader} from '@loaders.gl/ogc/wms';



for await (const batch of await loadInBatches(wfsResponse, GMLLoader)) {

  consume(batch.data);

}
```

The streaming parser buffers incomplete XML features across network chunks and returns Arrow table batches. Each batch infers its property schema independently. Use `gml.shape: 'geojson'` for FeatureCollection batches. Whole-file parsing also accepts bare geometries (one Arrow row).

## Preserve property types[​](#preserve-property-types "Direct link to Preserve property types")

GML application schemas often carry scalar types that cannot be inferred safely from text. Supply known types from `DescribeFeatureType` or application metadata:

```
import {GMLLoaderWithParser} from '@loaders.gl/ogc/wms/gml-loader';



const table = GMLLoaderWithParser.parseTextSync(xml, {

  gml: {

    propertyTypes: {

      population: 'integer',

      active: 'boolean',

      observedAt: 'date-time'

    }

  }

});
```

Unknown or untyped properties remain strings; structured XML properties are JSON-encoded in Arrow columns. Explicit `gml.shape: 'geojson'` retains the original structured property values. This avoids silently turning identifiers, codes, or zero-padded values into numbers.

## GML and WFS[​](#gml-and-wfs "Direct link to GML and WFS")

Most applications should use [`WFSSourceLoader`](https://loaders.gl/next/docs/modules/ogc/wms/formats/wfs.md) rather than invoke `GMLLoader` directly. The WFS source negotiates the response format, applies paging and CRS request rules, streams GML, and converts the result to GeoJSON, binary, or Arrow output.

## Boundaries[​](#boundaries "Direct link to Boundaries")

GML is an extensible modeling language, not one fixed feature schema. loaders.gl intentionally does not claim universal GML conformance. The supported subset is designed for interoperable WFS feature ingestion; specialized domains may require an application-schema adapter.

## References[​](#references "Direct link to References")

* [OGC GML standard](https://www.ogc.org/standard/gml/)
* [Geography Markup Language overview](https://en.wikipedia.org/wiki/Geography_Markup_Language)
