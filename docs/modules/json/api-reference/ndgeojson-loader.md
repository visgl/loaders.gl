---
title: NDGeoJSONLoader
description: Stream newline-delimited GeoJSON features into application or table data.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="JSON module · geospatial streaming"
  title="NDGeoJSONLoader"
  description="Stream GeoJSON features as newline-delimited records, keeping a large feature collection usable in incremental rendering and analysis workflows."
  tone="mint"
  meta={['From v1.0', 'GeoJSONL', 'Streaming features']}
  links={[
    {label: 'GeoJSON format', to: '/docs/modules/json/formats/geojson'},
    {label: 'GeoJSONLoader', to: '/docs/modules/json/api-reference/geojson-loader'},
    {label: 'JSON module', to: '/docs/modules/json'}
  ]}
/>

<JsonDocsTabs active="ndgeojsonloader" tryItHref="/examples/geospatial/geojson" />

<DocOrientation
  eyebrow="What it reads"
  title="Process features one line at a time."
  description="NDGeoJSONLoader is the line-oriented GeoJSON path for files and streams that should not be held as one large FeatureCollection before processing begins."
  tone="mint"
  items={[
    {label: 'Input', value: 'One GeoJSON feature per line'},
    {label: 'Output', value: 'Arrow tables and bounded Arrow batches'},
    {label: 'Geometry', value: 'GeoArrow WKB with feature property columns'},
    {label: 'Use cases', value: 'Large exports, maps, and stream processing'}
  ]}
/>

<ReferenceBoundary
  title="NDGeoJSONLoader reference"
  description="The sections below document the line-oriented formats, usage, output, and streaming behavior."
  tone="mint"
/>

For GeoJSON, the root level FeatureCollection object is removed with a simple array of features, one per line

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).

| Loader         | Characteristic                                                                     |
| -------------- | ---------------------------------------------------------------------------------- |
| File Extension | `.ndgeojson`, `.geojsonl`, `.ldgeojson`                                            |
| Media Type     | `application/geo+x-ndjson`, `application/geo+x-ldjson`, `application/geo+json-seq` |
| File Type      | Text                                                                               |
| File Format    | [NDJSON][format_ndjson], [LDJSON][format_ldjson], [JSON Text Sequences][format_geojsonseq] |
| Data Format    | [Arrow table](/docs/specifications/category-table), or explicit object rows       |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`                                     |

## Usage

```typescript
import {load, parseInBatches} from '@loaders.gl/core';
import {NDGeoJSONLoader} from '@loaders.gl/json';

const table = await load('features.ndgeojson', NDGeoJSONLoader);
console.log(table.data.numRows);

for await (const batch of await parseInBatches(chunks, NDGeoJSONLoader, {
  core: {batchSize: 1000}
})) {
  console.log(batch.data.numRows);
}
```

The package root exports a metadata-only loader. For `parseSync`, import
`NDGeoJSONLoaderWithParser` from `@loaders.gl/json/ndgeojson-loader`.

## Output and options

The default result is `{shape: 'arrow-table', schema, data}`, where `data` is an Apache Arrow
table. Feature properties and IDs become columns and geometry uses the `geoarrow.wkb` extension.
Feature IDs use the `id` column. If a feature ID collides with an existing property named `id`,
Arrow conversion throws instead of overwriting either value; explicit object rows preserve both.
Set `geojson.shape: 'object-row-table'` to return `{shape: 'object-row-table', data: Feature[]}`
with complete, unmodified GeoJSON feature objects.

Arrow conversion accepts the same `json.schema`, `json.arrowConversion`,
`json.geoarrowGeometryColumn`, and `geoarrow.encodingPreference` options as `GeoJSONLoader`.
Streaming freezes the schema after the first nonempty batch; incompatible later records follow
the shared JSON Arrow conversion policy. Provide `json.schema` when later records contain fields
not represented in the first batch. Native/optimized geometry streams use a stable
`geoarrow.geometry` union so later geometry types remain representable.

Input must contain one complete GeoJSON Feature per line. Blank lines, CRLF, a final line without
a newline, and optional record-separator prefixes are accepted. Multiline JSON Text Sequence
records are not supported. Streaming handles arbitrary UTF-8 chunk boundaries and emits at most
`core.batchSize` rows per batch (default `1000`).

[format_geojsonl]: https://www.placemark.io/documentation/geojsonl
[format_ndjson]: http://ndjson.org/
[format_ldjson]: http://jsonlines.org/
[format_geojsonseq]: https://datatracker.ietf.org/doc/html/rfc7464
