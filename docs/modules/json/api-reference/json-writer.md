import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';

# JSONWriter

<JsonDocsTabs active="jsonwriter" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

`JSONWriter` writes loaders.gl tables as JSON text.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Table} from '@loaders.gl/schema';
import {JSONWriter} from '@loaders.gl/json';

declare const table: Table;

const data = await encode(table, JSONWriter); // ArrayBuffer
const text = JSONWriter.encodeTextSync(table, {json: options}); // string
```

## JSONWriter Options

| Option         | Type                                             | Default | Description                                                |
| -------------- | ------------------------------------------------ | ------- | ---------------------------------------------------------- |
| `json.shape`   | `'object-row-table' \| 'array-row-table'`        |         | Selects object-row or array-row JSON table output.         |
| `json.wrapper` | `(table: RowObject[] \| RowArray[]) => unknown`  |         | Wraps the encoded table rows in a custom JSON value.       |
