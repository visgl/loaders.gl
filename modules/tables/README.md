# @loaders.gl/tables

Proof of concept for [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248).

This package owns the CSV, Avro, BSON, and Excel implementations. Its root exports metadata-only loaders, writer APIs, and shared types. Import a format subpath for its parser-bearing loader. Existing format packages forward to this package.

See [the POC guide](../../docs/developer-guide/grouped-packages.md) for examples, compatibility limits, and dependency tradeoffs.
