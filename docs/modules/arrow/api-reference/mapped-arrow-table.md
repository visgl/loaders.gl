---
title: MappedArrowTable
description: Add stable string-keyed lookup to an indexed Arrow table without copying the backing rows.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Mapped Arrow table"
  title="Keep Arrow columns. Add application-level keys."
  description="`MappedArrowTable` presents an `IndexedArrowTable` through a stable string-keyed view. Filtering, sorting, slicing, and concatenation remain table operations while keyed lookups stay predictable."
  tone="cyan"
  meta={['Indexed Arrow table', 'String-keyed lookup', 'Readonly view']}
  links={[
    {label: 'Arrow module', to: '/docs/modules/arrow'},
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'Table category', to: '/docs/specifications/category-table'}
  ]}
/>

<DocOrientation
  eyebrow="The mapped-table boundary"
  title="Map keys to rows. Keep table transforms composable."
  description="The mapped view separates application identity from physical row order, so callers can use keys without converting the Arrow table into a JavaScript object graph."
  tone="cyan"
  items={[
    {label: 'Backing data', value: 'An indexed Apache Arrow table'},
    {label: 'Mapping', value: 'String keys to visible row indexes'},
    {label: 'Transforms', value: 'Filter, sort, slice, and concatenate'},
    {label: 'Lookup', value: 'Last-wins keys with materialized rows on demand'}
  ]}
/>

`MappedArrowTable` is a readonly string-keyed row lookup view over an `IndexedArrowTable`.

<ReferenceBoundary
  title="Mapped lookup and transform details"
  description="The reference below covers key semantics, constructor inputs, row lookup, mapped transforms, concatenation, and inherited table operations."
  tone="cyan"
/>

Use it when an Arrow table has a stable application-level key, such as an id column, and you want
fast keyed row lookup while still preserving indexed-table operations such as filtering, sorting,
slicing, and concatenation.

## Key Semantics

- `rowKeys` stores keys in visible row order.
- Duplicate keys are preserved in visible row order.
- Keyed lookups are **last-wins**. If the same key appears multiple times, `getRowIndex(key)` and
  `getByKey(key)` resolve to the last visible occurrence.

## Usage

```typescript
import {MappedArrowTable} from '@loaders.gl/arrow';

const rowIndexMap = new Map([
  ['gamma', 2],
  ['alpha', 0]
]);

const mappedTable = new MappedArrowTable(table, rowIndexMap);

mappedTable.getByKey('gamma')?.name; // 'gamma'
mappedTable.getRowIndex('alpha'); // 0
mappedTable.getRowKey(1); // 'alpha'
```

## Filtering and Sorting

Mapped transforms preserve key entries instead of collapsing them into a plain indexed table.

```typescript
const filteredTable = mappedTable.filter(
  (currentTable, rowIndex) => (currentTable.getValue(rowIndex, 'score') ?? 0) >= 20
);

const sortedTable = filteredTable.sort(
  (currentTable, leftRowIndex, rightRowIndex) =>
    (currentTable.getValue(rightRowIndex, 'score') ?? 0) -
    (currentTable.getValue(leftRowIndex, 'score') ?? 0)
);
```

## Constructor

```typescript
new MappedArrowTable(table, rowIndexMap);
```

Parameters:

- `table`: backing `arrow.Table` in raw row order.
- `rowIndexMap`: string-key-to-raw-row mapping to expose through this mapped view.

## Properties

- `rowIndexMap`: string-key-to-raw-row lookup map. Duplicate keys use last-wins semantics.
- `rowKeys`: string keys in visible mapped-row order. Duplicate keys are preserved.
- All `IndexedArrowTable` properties are also available.

## Methods

### `getRowIndex(rowKey)`

Returns the raw backing-table row index for a mapped key, or `null` when the key is absent.

### `getRowKey(rowIndex)`

Returns the mapped key for a visible row index, or `null` when the index is invalid.

### `getByKey(rowKey)`

Returns a materialized Arrow row for a mapped key, or `null` when the key is absent.

### `atMapped(rowIndex)`

Reads a mapped row using `Array.prototype.at` semantics. Negative indexes count backward from the
end of the visible mapped view.

### `slice(begin, end)`

Returns a sliced mapped view over the same backing table and preserves mapped key entries.

### `filter(predicate)`

Returns a filtered mapped view over the same backing table and preserves mapped key entries.

### `sort(compare)`

Returns a sorted mapped view over the same backing table and preserves mapped key entries.

### `concat(...others)`

Concatenates this mapped view with other mapped views sharing an identical Arrow schema. The result
owns a new backing Arrow table, preserves visible mapped-row order including duplicate keys, and
keeps last-wins keyed lookup behavior.

All other `IndexedArrowTable` methods, including `getValue()`, `getChild()`,
`materializeArrowTable()`, `toArray()`, and iteration, are inherited.
