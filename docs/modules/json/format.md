import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';

# JSON Format

<JsonDocsTabs active="format" />

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/json/api-reference/json-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>JSONLoader</strong>
    <span>Loads JSON documents and can extract arrays as loaders.gl row or Arrow tables.</span>
    <span className="docs-api-card__meta">Output: object, ObjectRowTable, ArrayRowTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/json/api-reference/json-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>JSONWriter</strong>
    <span>Writes loaders.gl tables as JSON arrays or custom wrapped JSON values.</span>
    <span className="docs-api-card__meta">Input: Table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeTextSync</span>
  </a>
</div>

| Characteristic | Value                                         |
| -------------- | --------------------------------------------- |
| File Format    | JSON                                          |
| Data Format    | JSON objects, arrays, and [Tables](/docs/specifications/category-table) |
| File Type      | Text                                          |
| File Extension | `.json`                                       |
| MIME Types     | `application/json`                            |

## Streaming Variants

| Format                                            | Extension    | MIME Media Type            | Support                                                       |
| ------------------------------------------------- | ------------ | -------------------------- | ------------------------------------------------------------- |
| [JSON](https://www.json.org/json-en.html)         | `.json`      | `application/json`         | `JSONLoader`                                                  |
| [NewLine Delimited JSON](http://ndjson.org/)      | `.ndjson`    | `application/x-ndjson`     | `NDJSONLoader`                                                |
| [JSON Lines](http://jsonlines.org/)               | `.jsonl`     | `application/x-ldjson`     | `NDJSONLoader`                                                |
| [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464) |              | `application/json-seq`     | `NDJSONLoader`. Partial records must not span multiple lines. |
| [GeoJSON](https://geojson.org/)                   | `.geojson`   | `application/geo+json`     | `GeoJSONLoader`                                               |
| [Newline Delimited GeoJSON](https://stevage.github.io/ndgeojson/) | `.ndgeojson` |                            | `NDGeoJSONLoader`                                             |
| [GeoJSON Lines](https://www.placemark.io/documentation/geojsonl) | `.geojsonl`  |                            | `NDGeoJSONLoader`                                             |
| [GeoJSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc8142) |              | `application/geo+json-seq` | `NDGeoJSONLoader`                                             |
