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
    {label: 'Output', value: 'Incremental feature batches'},
    {label: 'Geometry', value: 'GeoJSON geometry and properties'},
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
| Data Format    | [Classic Table](/docs/specifications/category-table)                               |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`                                     |

[format_geojsonl]: https://www.placemark.io/documentation/geojsonl
[format_ndjson]: http://ndjson.org/
[format_ldjson]: http://jsonlines.org/
[format_geojsonseq]: https://datatracker.ietf.org/doc/html/rfc7464
