# NDGeoJSONLoader

For GeoJSON, the root level FeatureCollection object is removed with a simple array of features, one per line

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.ndgeojson`, `.geojsonl`, `.ldgeojson`              |
| Media Type     | `application/geo+x-ndjson`, `application/geo+x-ldjson`, `application/geo+json-seq` |
| File Type      | Text                                                 |
| File Format    | [NDJSON][format_ndjson], [LDJSON][format_], [][format_] |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

[format_geojsonl]: https://www.placemark.io/documentation/geojsonl
[format_geojsonseq]:
[format_ldjson]: http://ndjson.org/
[format_jsonjson]: http://ndjson.org/
