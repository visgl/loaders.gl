# IndexedArrowTable

`IndexedArrowTable` and `IndexedArrowVector` provide readonly indexed views over Apache Arrow JS
tables and vectors.

Use these classes when you want to filter, sort, slice, or reorder an Arrow table without copying
column data immediately. The view stores row indexes and only copies values when you call
`materializeArrowTable()`, `toArray()`, or iterate rows.

## Concepts

- A **raw row index** is the row position in the backing `arrow.Table`.
- A **visible row index** is the row position in the indexed view.
- Duplicate raw row indexes are preserved. This lets one backing Arrow row appear multiple times in
  a view.

## Usage

```typescript
import * as arrow from 'apache-arrow';
import {IndexedArrowTable} from '@loaders.gl/arrow';

const table = new arrow.Table({
  name: arrow.vectorFromArray(['alpha', 'beta', 'gamma'], new arrow.Utf8()),
  score: arrow.vectorFromArray([10, 20, 30], new arrow.Float64())
});

const indexedTable = new IndexedArrowTable(table, [2, 0]);

indexedTable.get(0)?.name; // 'gamma'
indexedTable.getValue(1, 'score'); // 10
indexedTable.getChild('name')?.toArray(); // ['gamma', 'alpha']
```

## Filtering and Sorting

Predicates and comparators receive visible row indexes. Use `getValue()` to read column values
without materializing row objects.

```typescript
const filteredTable = new IndexedArrowTable(table).filter(
  (currentTable, rowIndex) => (currentTable.getValue(rowIndex, 'score') ?? 0) >= 20
);

const sortedTable = filteredTable.sort(
  (currentTable, leftRowIndex, rightRowIndex) =>
    (currentTable.getValue(rightRowIndex, 'score') ?? 0) -
    (currentTable.getValue(leftRowIndex, 'score') ?? 0)
);
```

## `IndexedArrowTable`

### Constructor

```typescript
new IndexedArrowTable(table, indexes);
```

Parameters:

- `table`: backing `arrow.Table` in raw row order.
- `indexes`: optional raw row indexes to expose. When omitted, the view exposes all rows in raw
  order.

### Static Methods

#### `IndexedArrowTable.fromOwnedIndexes(table, indexes)`

Builds an indexed table from an owned `Int32Array` without copying it. Do not mutate the index
array after passing ownership to the table.

### Properties

- `table`: backing `arrow.Table`.
- `schema`: backing `arrow.Schema`.
- `indexes`: `Int32Array` of raw row indexes in visible order.
- `numRows`: number of visible rows.
- `numCols`: number of columns in the backing table.

### Methods

#### `getRawIndex(rowIndex)`

Returns the raw backing-table row index for a visible row index, or `null` for an invalid visible
index.

#### `get(rowIndex)`

Returns a materialized Arrow row for a visible row index, or `null` for an invalid visible index.

#### `getTemporaryRow(rowIndex)`

Returns a reusable scratch row object for a visible row index. The same object is mutated by the
next `getTemporaryRow()` call on the same indexed table, so copy values you need to retain.

#### `at(rowIndex)`

Reads a row using `Array.prototype.at` semantics. Negative indexes count backward from the end of
the visible view.

#### `getValue(rowIndex, columnName)`

Returns a typed column value for a visible row, or `null` when the row index or column is not
available.

#### `getChild(columnName)`

Returns an `IndexedArrowVector` view for a backing column, or `null` when the column is missing.

#### `slice(begin, end)`

Returns a sliced indexed view over the same backing table.

#### `filter(predicate)`

Returns a filtered indexed view over the same backing table.

#### `sort(compare)`

Returns a sorted indexed view over the same backing table.

#### `concat(...others)`

Concatenates this indexed view with other indexed views sharing an identical Arrow schema. The
result owns a new backing Arrow table and preserves visible row order from each source view.

#### `find(predicate)` and `findIndex(predicate)`

Array-like search helpers over visible rows.

#### `materializeArrowTable()`

Copies the visible rows into a new concrete Arrow table. Visible row order and duplicate indexes are
preserved.

#### `toArray()` and `[Symbol.iterator]()`

Materialize or iterate visible rows in indexed order.

## `IndexedArrowVector`

`IndexedArrowVector` is the column-vector equivalent of `IndexedArrowTable`. It wraps one
`arrow.Vector` and an index array.

```typescript
const nameColumn = indexedTable.getChild('name');

nameColumn?.get(0); // 'gamma'
nameColumn?.at(-1); // 'alpha'
nameColumn?.slice(1).toArray(); // ['alpha']
```

Properties:

- `vector`: backing `arrow.Vector`.
- `indexes`: `Int32Array` of raw row indexes.
- `length`: number of visible values.

Methods:

- `get(rowIndex)`
- `at(rowIndex)`
- `slice(begin, end)`
- `toArray()`
- `[Symbol.iterator]()`
