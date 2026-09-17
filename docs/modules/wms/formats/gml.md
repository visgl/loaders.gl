---
title: GML - Geography Markup Language
description: Parse the interoperable feature and geometry subset commonly returned by WFS services.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC feature encoding"
  title="Read structured features from XML without guessing their geometry."
  description="GML is an extensible XML grammar rather than one fixed schema. loaders.gl focuses on the feature and geometry subset used in production WFS responses and can emit features incrementally as the document arrives."
  tone="mint"
  meta={['GML 2 and 3', 'Streaming XML', 'GeoJSON and Arrow through WFS']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WFS format', to: '/docs/modules/wms/formats/wfs'},
    {label: 'XML module', to: '/docs/modules/xml'}
  ]}
/>

<DocOrientation
  eyebrow="The GML parsing path"
  title="Frame feature members. Normalize geometry. Preserve unknown properties."
  description="The parser follows XML structure instead of searching text with regular expressions. Applications can supply known scalar types while retaining unrecognized application-schema content."
  tone="mint"
  items={[
    {label: 'Input', value: 'GML feature collection or WFS response'},
    {label: 'Parse', value: 'Namespaces, feature members, and coordinate encodings'},
    {label: 'Normalize', value: 'Points, lines, polygons, and multiparts'},
    {label: 'Stream', value: 'Feature batches for large XML responses'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

GML is the OGC XML grammar for geographical features. loaders.gl focuses on the feature and
geometry subset encountered in production WFS responses, with incremental parsing for large
collections.

<ReferenceBoundary
  title="GML grammar and parser details"
  description="The reference below covers supported geometry encodings, CRS metadata, streaming behavior, scalar type hints, and the boundary between GML and WFS."
  tone="mint"
/>

## Feature support

| Capability | Support | Notes |
| --- | --- | --- |
| GML 2 feature members | Supported | Common WFS feature collection structures and geometry properties |
| GML 3 / 3.2 feature members | Supported | Namespace-prefix independent parsing |
| Point and MultiPoint | Supported | GML 2 and GML 3 coordinate encodings |
| LineString, Curve, and multi-line geometry | Supported | Segment coordinates are normalized to GeoJSON-compatible lines |
| Polygon, Surface, and multi-polygon geometry | Supported | Exterior and interior rings are preserved |
| `coord` / `coordinates` | Supported | Legacy GML 2 coordinate encodings |
| `pos` / `posList` | Supported | Dimensional GML 3 coordinate encodings |
| CRS identifiers | Preserved | `srsName` is read; reprojection is not silently applied by the parser |
| Axis order | Service-aware | WFS source logic handles known CRS axis-order rules |
| Streaming | Supported | `parseInBatches` emits collections as feature members arrive |
| Schema-aware scalar properties | Supported | Supply string, boolean, integer, number, date, and date-time hints |
| GeoJSON output | Supported | Default geospatial representation |
| Binary and Arrow output | Through WFS | `WFSSourceLoader` converts parsed GML to standard vector outputs |
| Arbitrary GML application schemas | Best effort | Unknown XML properties are preserved instead of guessed |
| Topologies, solids, and every ISO geometry primitive | Not supported | Outside the practical WFS feature subset |

## Parse a document

The package root exports metadata-only loaders; async core APIs preload the parser automatically:

```ts
import {load} from '@loaders.gl/core';
import {GMLLoader} from '@loaders.gl/wms';

const table = await load('features.gml', GMLLoader);
console.log(table.data.numRows);
```

## Stream a large response

```ts
import {loadInBatches} from '@loaders.gl/core';
import {GMLLoader} from '@loaders.gl/wms';

for await (const batch of await loadInBatches(wfsResponse, GMLLoader)) {
  consume(batch.data);
}
```

The streaming parser buffers incomplete XML features across network chunks and returns Arrow
table batches. Each batch infers its property schema independently. Use `gml.shape: 'geojson'`
for FeatureCollection batches. Whole-file parsing also accepts bare geometries (one Arrow row).

## Preserve property types

GML application schemas often carry scalar types that cannot be inferred safely from text. Supply
known types from `DescribeFeatureType` or application metadata:

```ts
import {GMLLoaderWithParser} from '@loaders.gl/wms/gml-loader';

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

Unknown or untyped properties remain strings; structured XML properties are JSON-encoded in
Arrow columns. Explicit `gml.shape: 'geojson'` retains the original structured property values.
This avoids silently turning identifiers, codes, or zero-padded values into numbers.

## GML and WFS

Most applications should use [`WFSSourceLoader`](./wfs) rather than invoke `GMLLoader` directly.
The WFS source negotiates the response format, applies paging and CRS request rules, streams GML,
and converts the result to GeoJSON, binary, or Arrow output.

## Boundaries

GML is an extensible modeling language, not one fixed feature schema. loaders.gl intentionally
does not claim universal GML conformance. The supported subset is designed for interoperable WFS
feature ingestion; specialized domains may require an application-schema adapter.

## References

- [OGC GML standard](https://www.ogc.org/standard/gml/)
- [Geography Markup Language overview](https://en.wikipedia.org/wiki/Geography_Markup_Language)
