Mapped Arrow table

![](/next/images/format-logos/apache-arrow-logo.png)

# MappedArrowTable

`MappedArrowTable` presents an `IndexedArrowTable` through a stable string-keyed view. Filtering, sorting, slicing, and concatenation remain table operations while keyed lookups stay predictable.

[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)

The mapped-table boundary

## Map keys to rows. Keep table transforms composable.

The mapped view separates application identity from physical row order, so callers can use keys without converting the Arrow table into a JavaScript object graph.

01

Backing data

An indexed Apache Arrow table

02

Mapping

String keys to visible row indexes

03

Transforms

Filter, sort, slice, and concatenate

04

Lookup

Last-wins keys with materialized rows on demand

`MappedArrowTable` is a readonly string-keyed row lookup view over an `IndexedArrowTable`.

Detailed guide

## Mapped lookup and transform details

The reference below covers key semantics, constructor inputs, row lookup, mapped transforms, concatenation, and inherited table operations.

Use it when an Arrow table has a stable application-level key, such as an id column, and you want fast keyed row lookup while still preserving indexed-table operations such as filtering, sorting, slicing, and concatenation.

## Key Semantics[​](#key-semantics "Direct link to Key Semantics")

* `rowKeys` stores keys in visible row order.
* Duplicate keys are preserved in visible row order.
* Keyed lookups are **last-wins**. If the same key appears multiple times, `getRowIndex(key)` and `getByKey(key)` resolve to the last visible occurrence.

## Usage[​](#usage "Direct link to Usage")

```
import {MappedArrowTable} from '@loaders.gl/tables/arrow';



const rowIndexMap = new Map([

  ['gamma', 2],

  ['alpha', 0]

]);



const mappedTable = new MappedArrowTable(table, rowIndexMap);



mappedTable.getByKey('gamma')?.name; // 'gamma'

mappedTable.getRowIndex('alpha'); // 0

mappedTable.getRowKey(1); // 'alpha'
```

## Filtering and Sorting[​](#filtering-and-sorting "Direct link to Filtering and Sorting")

Mapped transforms preserve key entries instead of collapsing them into a plain indexed table.

```
const filteredTable = mappedTable.filter(

  (currentTable, rowIndex) => (currentTable.getValue(rowIndex, 'score') ?? 0) >= 20

);



const sortedTable = filteredTable.sort(

  (currentTable, leftRowIndex, rightRowIndex) =>

    (currentTable.getValue(rightRowIndex, 'score') ?? 0) -

    (currentTable.getValue(leftRowIndex, 'score') ?? 0)

);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new MappedArrowTable(table, rowIndexMap);
```

Parameters:

* `table`: backing `arrow.Table` in raw row order.
* `rowIndexMap`: string-key-to-raw-row mapping to expose through this mapped view.

## Properties[​](#properties "Direct link to Properties")

* `rowIndexMap`: string-key-to-raw-row lookup map. Duplicate keys use last-wins semantics.
* `rowKeys`: string keys in visible mapped-row order. Duplicate keys are preserved.
* All `IndexedArrowTable` properties are also available.

## Methods[​](#methods "Direct link to Methods")

### `getRowIndex(rowKey)`[​](#getrowindexrowkey "Direct link to getrowindexrowkey")

Returns the raw backing-table row index for a mapped key, or `null` when the key is absent.

### `getRowKey(rowIndex)`[​](#getrowkeyrowindex "Direct link to getrowkeyrowindex")

Returns the mapped key for a visible row index, or `null` when the index is invalid.

### `getByKey(rowKey)`[​](#getbykeyrowkey "Direct link to getbykeyrowkey")

Returns a materialized Arrow row for a mapped key, or `null` when the key is absent.

### `atMapped(rowIndex)`[​](#atmappedrowindex "Direct link to atmappedrowindex")

Reads a mapped row using `Array.prototype.at` semantics. Negative indexes count backward from the end of the visible mapped view.

### `slice(begin, end)`[​](#slicebegin-end "Direct link to slicebegin-end")

Returns a sliced mapped view over the same backing table and preserves mapped key entries.

### `filter(predicate)`[​](#filterpredicate "Direct link to filterpredicate")

Returns a filtered mapped view over the same backing table and preserves mapped key entries.

### `sort(compare)`[​](#sortcompare "Direct link to sortcompare")

Returns a sorted mapped view over the same backing table and preserves mapped key entries.

### `concat(...others)`[​](#concatothers "Direct link to concatothers")

Concatenates this mapped view with other mapped views sharing an identical Arrow schema. The result owns a new backing Arrow table, preserves visible mapped-row order including duplicate keys, and keeps last-wins keyed lookup behavior.

All other `IndexedArrowTable` methods, including `getValue()`, `getChild()`, `materializeArrowTable()`, `toArray()`, and iteration, are inherited.
