# @loaders.gl/json

This module contains a table loader for the JSON and line delimited JSON formats.

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent visualization-focused loaders (parsers).

## Fast Arrow Utf8 capture

`JSONTableLoader` can preserve row-level nested JSON values as exact source text while streaming
Arrow batches with `json.backend: 'fast'`. Supply `json.shape: 'arrow-table'` plus a schema whose
row-level field type is `utf8`; when the source value for that field is an object or array, the
Utf8 Arrow value keeps that JSON slice exactly, including whitespace, key order, and escape spelling.

This optimization applies only to streamed fast-backend Arrow parsing. Direct or synchronous parsing,
non-fast streaming, and nested schema descendants keep their existing conversion behavior.

Arrow conversion can also opt into `json.arrowConversion.utf8Conversion: 'number-to-string'`
when a schema intentionally stores numeric source values in Utf8 columns.
