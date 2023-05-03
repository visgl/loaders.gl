# Overview

The `@loaders.gl/json` module parses JSON. It can parse arbitrary JSON data but is optimized for:

- loading tabular data stored in JSON arrays.
- loading tabular geospatial data stored in GeoJSON.
- loading tabular data from various streaming JSON and GeoJSON formats, such as new-line delimited JSON.

The JSON loaders also support batched parsing which can be useful when loading very large tabular JSON files
to avoid blocking for tens of seconds.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/json
```

## Loaders and Writers

| Loader                                                                |
| --------------------------------------------------------------------- |
| [`JSONLoader`](/docs/modules/json/api-reference/json-loader)           |
| [`NDJSONLoader`](/docs/modules/json/api-reference/ndjson-loader)       |
| [`GeoJSONLoader`](/docs/modules/json/api-reference/geojson-loader)     |
| [`NDGeoJSONLoader`](/docs/modules/json/api-reference/ndgeojson-loader) |

## Additional APIs

- See [table category](/docs/specifications/category-table).
- See [GIS category](/docs/specifications/category-gis).

## JSON Format Notes

The classic JSON format was designed for simplicity and is supported by standard libraries in many programming languages.

Several [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia) have emerged, that typically
place one JSON object on each line of a file. These are convenient to use when streaming data and are 
supported by via the `NDJSONLoader` and `NDGeoJSONLoader`.

At the moment, auto-detection between streaming and classic JSON based on file contents 
is not implemented, so two separate loaders are provided. 
The two loaders look for different file extensions or MIME types as specified in the table below, 
allowing correct distinctions to be made in usage.

| Format                                            | Extension    | MIME Media Type            | Support                                                      |
| ------------------------------------------------- | ------------ | -------------------------- | ------------------------------------------------------------ | --- |
| [JSON][format_json]                               | `.json`      | `application/json`         | `JSONLoader`                                               |
| [NewLine Delimited JSON][format_ndjson]           | `.ndjson`    | `application/x-ndjson`     | `NDJSONLoader`                                             |
| [JSON Lines][format_jsonlines]                    | `.jsonl`     | `application/x-ldjson`     | `NDJSONLoader`                                             |
| [JSON Text Sequences][format_json_seq]            |              | `application/json-seq`     | `NDJSONLoader`. Partial records must not span multiple lines. |     |
| [GeoJSON][format_geojson]                         | `.json`      | `application/geo+json`     | `JSONLoader`                                               |
| [Newline Delimited GeoJSON][format_ndgeojson]     | `.ndgeojson` |                            | `NDJSONLoader`                                             |
| [GeoJSON Lines][format_geojson]                   | `.geojsonl`  |                            | `NDJSONLoader`                                             |
| [GeoJSON Text Sequences][format_geojson_text_seq] |              | `application/geo+json-seq` | `NDJSONLoader`                                             |

[format_json]: https://www.json.org/json-en.html
[format_ndjson]: http://ndjson.org/
[format_jsonlines]: http://jsonlines.org/
[format_json_seq]: https://datatracker.ietf.org/doc/html/rfc7464
[format_geojson]: https://geojson.org/
[format_ndgeojson]: https://stevage.github.io/ndgeojson/
[format_geojsonl]: https://www.placemark.io/documentation/geojsonl
[format_geojson_text_seq]: https://datatracker.ietf.org/doc/html/rfc8142
[rfc4288]: https://www.ietf.org/rfc/rfc4288.txt
