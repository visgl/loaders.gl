# @loaders.gl/schema

> Table

## Table APIs

The table API is modelled after a subset of the Apache Arrow API:

| Class                                                              | Arrow Counterpart | Description  |
| ------------------------------------------------------------------ | ----------------- | ------------ |
| [`Table`](modules/schema/docs/api-reference/table.md)              | Table             | Table        |
| [`TableSchema`](modules/schema/docs/api-reference/table-schema.md) | `Schema`          | Table schema |
| [`TableBatch`](modules/schema/docs/api-reference/table-batch.md)   | `RecordBatch`     | Table batch  |

## Micro-Loaders

Loaders with limited functionality but with minimal bundle size impact:

| Loader       | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| `JSONLoader` | A minimal non-streaming JSON loader that uses the built-in `JSON.parse` function      |
| `XMLLoader`  | A non-streaming, browser-only XML loader that uses the browser's built-in DOM parser. |
