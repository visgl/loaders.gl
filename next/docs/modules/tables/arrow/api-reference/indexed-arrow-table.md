Arrow table view

![](/next/images/format-logos/apache-arrow-logo.png)

# IndexedArrowTable

IndexedArrowTable and IndexedArrowVector add a readonly index over Arrow data. Filtering, sorting, slicing, and repeated row views can stay as indexes until an application explicitly asks for copied values.

[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

Views over columns

## Change row order without rewriting every column.

The indexed view stores visible-to-raw row mappings. It is useful for query results, sorting, and UI tables where copying the complete Arrow table would be premature.

01

Stores

Visible row indexes over a backing Arrow table

02

Supports

Filtering, sorting, slicing, and duplicate rows

03

Reads

Values and child vectors through the indexed view

04

Materializes

Only when callers request a new table or row array

`IndexedArrowTable` and `IndexedArrowVector` provide readonly indexed views over Apache Arrow JS tables and vectors.

Use these classes when you want to filter, sort, slice, or reorder an Arrow table without copying column data immediately. The view stores row indexes and only copies values when you call `materializeArrowTable()`, `toArray()`, or iterate rows.

Detailed guide

## Indexed view details

The sections below document row indexes, filtering, sorting, materialization, and vector access.

## Concepts[​](#concepts "Direct link to Concepts")

* A **raw row index** is the row position in the backing `arrow.Table`.
* A **visible row index** is the row position in the indexed view.
* Duplicate raw row indexes are preserved. This lets one backing Arrow row appear multiple times in a view.

## Usage[​](#usage "Direct link to Usage")

```
import * as arrow from 'apache-arrow';

import {IndexedArrowTable} from '@loaders.gl/tables/arrow';



const table = new arrow.Table({

  name: arrow.vectorFromArray(['alpha', 'beta', 'gamma'], new arrow.Utf8()),

  score: arrow.vectorFromArray([10, 20, 30], new arrow.Float64())

});



const indexedTable = new IndexedArrowTable(table, [2, 0]);



indexedTable.get(0)?.name; // 'gamma'

indexedTable.getValue(1, 'score'); // 10

indexedTable.getChild('name')?.toArray(); // ['gamma', 'alpha']
```

## Filtering and Sorting[​](#filtering-and-sorting "Direct link to Filtering and Sorting")

Predicates and comparators receive visible row indexes. Use `getValue()` to read column values without materializing row objects.

```
const filteredTable = new IndexedArrowTable(table).filter(

  (currentTable, rowIndex) => (currentTable.getValue(rowIndex, 'score') ?? 0) >= 20

);



const sortedTable = filteredTable.sort(

  (currentTable, leftRowIndex, rightRowIndex) =>

    (currentTable.getValue(rightRowIndex, 'score') ?? 0) -

    (currentTable.getValue(leftRowIndex, 'score') ?? 0)

);
```

## `IndexedArrowTable`[​](#indexedarrowtable "Direct link to indexedarrowtable")

### Constructor[​](#constructor "Direct link to Constructor")

```
new IndexedArrowTable(table, indexes);
```

Parameters:

* `table`: backing `arrow.Table` in raw row order.
* `indexes`: optional raw row indexes to expose. When omitted, the view exposes all rows in raw order.

### Static Methods[​](#static-methods "Direct link to Static Methods")

#### `IndexedArrowTable.fromOwnedIndexes(table, indexes)`[​](#indexedarrowtablefromownedindexestable-indexes "Direct link to indexedarrowtablefromownedindexestable-indexes")

Builds an indexed table from an owned `Int32Array` without copying it. Do not mutate the index array after passing ownership to the table.

### Properties[​](#properties "Direct link to Properties")

* `table`: backing `arrow.Table`.
* `schema`: backing `arrow.Schema`.
* `indexes`: `Int32Array` of raw row indexes in visible order.
* `numRows`: number of visible rows.
* `numCols`: number of columns in the backing table.

### Methods[​](#methods "Direct link to Methods")

#### `getRawIndex(rowIndex)`[​](#getrawindexrowindex "Direct link to getrawindexrowindex")

Returns the raw backing-table row index for a visible row index, or `null` for an invalid visible index.

#### `get(rowIndex)`[​](#getrowindex "Direct link to getrowindex")

Returns a materialized Arrow row for a visible row index, or `null` for an invalid visible index.

#### `getTemporaryRow(rowIndex)`[​](#gettemporaryrowrowindex "Direct link to gettemporaryrowrowindex")

Returns a reusable scratch row object for a visible row index. The same object is mutated by the next `getTemporaryRow()` call on the same indexed table, so copy values you need to retain.

#### `at(rowIndex)`[​](#atrowindex "Direct link to atrowindex")

Reads a row using `Array.prototype.at` semantics. Negative indexes count backward from the end of the visible view.

#### `getValue(rowIndex, columnName)`[​](#getvaluerowindex-columnname "Direct link to getvaluerowindex-columnname")

Returns a typed column value for a visible row, or `null` when the row index or column is not available.

#### `getChild(columnName)`[​](#getchildcolumnname "Direct link to getchildcolumnname")

Returns an `IndexedArrowVector` view for a backing column, or `null` when the column is missing.

#### `slice(begin, end)`[​](#slicebegin-end "Direct link to slicebegin-end")

Returns a sliced indexed view over the same backing table.

#### `filter(predicate)`[​](#filterpredicate "Direct link to filterpredicate")

Returns a filtered indexed view over the same backing table.

#### `sort(compare)`[​](#sortcompare "Direct link to sortcompare")

Returns a sorted indexed view over the same backing table.

#### `concat(...others)`[​](#concatothers "Direct link to concatothers")

Concatenates this indexed view with other indexed views sharing an identical Arrow schema. The result owns a new backing Arrow table and preserves visible row order from each source view.

#### `find(predicate)` and `findIndex(predicate)`[​](#findpredicate-and-findindexpredicate "Direct link to findpredicate-and-findindexpredicate")

Array-like search helpers over visible rows.

#### `materializeArrowTable()`[​](#materializearrowtable "Direct link to materializearrowtable")

Copies the visible rows into a new concrete Arrow table. Visible row order and duplicate indexes are preserved.

#### `toArray()` and `[Symbol.iterator]()`[​](#toarray-and-symboliterator "Direct link to toarray-and-symboliterator")

Materialize or iterate visible rows in indexed order.

## `IndexedArrowVector`[​](#indexedarrowvector "Direct link to indexedarrowvector")

`IndexedArrowVector` is the column-vector equivalent of `IndexedArrowTable`. It wraps one `arrow.Vector` and an index array.

```
const nameColumn = indexedTable.getChild('name');



nameColumn?.get(0); // 'gamma'

nameColumn?.at(-1); // 'alpha'

nameColumn?.slice(1).toArray(); // ['alpha']
```

Properties:

* `vector`: backing `arrow.Vector`.
* `indexes`: `Int32Array` of raw row indexes.
* `length`: number of visible values.

Methods:

* `get(rowIndex)`
* `at(rowIndex)`
* `slice(begin, end)`
* `toArray()`
* `[Symbol.iterator]()`
