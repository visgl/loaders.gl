import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# ArrowLoader

<ArrowDocsTabs active="arrowloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

The `ArrowLoader` parses the Apache Arrow columnar table format.

## Usage

```typescript
import {ArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, ArrowLoader, options);
```

## Shapes

`ArrowLoader` returns loaders.gl `ArrowTable` objects by default. Set `arrow.shape` to select another table representation.

| Shape              | Output                                                 |
| ------------------ | ------------------------------------------------------ |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Apache Arrow table |
| `columnar-table`   | loaders.gl columnar table                              |
| `array-row-table`  | loaders.gl row table with arrays                       |
| `object-row-table` | loaders.gl row table with objects                      |

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `arrow.shape` | `'arrow-table' \| 'columnar-table' \| 'array-row-table' \| 'object-row-table'` | `'arrow-table'` | Selects the returned loaders.gl table shape. |
| `arrow.batchDebounceMs` | `number` | `undefined` | Adds an async delay between emitted Arrow batches. |
