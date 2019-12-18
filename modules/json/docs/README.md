# JSONLoader (Experimental)

> This doc is a WIP

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.json`,                                             |
| File Type      | Text                                                 |
| File Format    | JSON                                                 |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Usage

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

The JSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows of the first array it encounters in the JSON. To e.g. parse a stream of GeoJSON:

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await loadInBatches('geojson.json', JSONLoader);

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

## Options

| Option       | Type    | Default | Description                                                            |
| ------------ | ------- | ------- | ---------------------------------------------------------------------- |
| `json.table` | Boolean | TBD     | Parse JSON as table, i.e. return the first embedded array in the JSON. |

### MIME Types and File Extensions

| Format                          | Extension | MIME Media Type [RFC4288](https://www.ietf.org/rfc/rfc4288.txt) |
| ------------------------------- | --------- | --------------------------------------------------------------- |
| Standard JSON                   | `.json`   | `application/json`                                              |
| Line-delimited JSON             | `.jsonl`  | -                                                               |
| NewLine delimited JSON          | `.ndjson` | `application/x-ndjson`                                          |
| Record separator-delimited JSON | -         | `application/json-seq`                                          |

## Attribution

The underlying `StreamingJSONParser` class is a fork of [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.

## Roadmap

### General Improvements

JSON is supported natively and `JSON.parse`. However there are a number of reasons why you might consider a custom JSON loader:

Error messages: `JSON.parse` tends to have unhelpful error messages

### Streaming JSON

#### Autodetection of streaming JSON

A number of hints can be used to determine if the data is formatted using a streaming JSON format

- if the filename extension is `.jsonl`
- if the MIMETYPE is `application/json-seq`
- if the first value in the file is a number, assume the file is length prefixed.

For data in non-streaming JSON format, the presence of a top-level array will start streaming of objects.

For embedded arrays, a path specifier may need to be supplied (or could look for first array).

#### Streaming JSON Formats

- Overview of [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia).

- [Line-delimited JSON](http://jsonlines.org/) (LDJSON) (aka JSON lines) (JSONL).
- [NewLine delimited JSON](https://github.com/ndjson/ndjson-spec)
- [Record separator-delimited JSON](https://tools.ietf.org/html/rfc7464) (IETF RFC 7464) (aka Json Text Sequences).
- Concatenated JSON
- Length-prefixed JSON

#### Streaming Options

- `streaming`: `auto` - assume the file contains multiple top level JSON objects (or a top-level array of objects).
- `lengthPrefixed`: `auto` - if the first value in the file is a number, assumes the file is length prefixed.
