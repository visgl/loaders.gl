# Overview

The `@loaders.gl/json` module handles tabular data stored in the [JSON file format](https://www.json.org/json-en.html).

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/json
```

## Loaders and Writers

| Loader                                                      |
| ----------------------------------------------------------- |
| [`JSONLoader`](modules/json/docs/api-reference/json-loader) |

## Additional APIs

See table category.

## Module Roadmap

### General Improvements

Error messages: `JSON.parse` tends to have unhelpful error messages

### Support Streaming JSON Formats

- Overview of [JSON Streaming Formats](https://en.wikipedia.org/wiki/JSON_streaming) (Wikipedia).

- [Line-delimited JSON](http://jsonlines.org/) (LDJSON) (aka JSON lines) (JSONL).
- [NewLine delimited JSON](https://github.com/ndjson/ndjson-spec)

### Autodetection of streaming JSON

A number of hints can be used to determine if the data is formatted using a streaming JSON format

- if the filename extension is `.jsonl`
- if the MIMETYPE is `application/json-seq`
- if the first value in the file is a number, assume the file is length prefixed.

For data in non-streaming JSON format, the presence of a top-level array will start streaming of objects.

For embedded arrays, a path specifier may need to be supplied (or could look for first array).

### MIME Types and File Extensions

| Format                          | Extension | MIME Media Type [RFC4288](https://www.ietf.org/rfc/rfc4288.txt) |
| ------------------------------- | --------- | --------------------------------------------------------------- |
| Standard JSON                   | `.json`   | `application/json`                                              |
| Line-delimited JSON             | `.jsonl`  | -                                                               |
| NewLine delimited JSON          | `.ndjson` | `application/x-ndjson`                                          |
| Record separator-delimited JSON | -         | `application/json-seq`                                          |
