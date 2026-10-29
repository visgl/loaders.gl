Arrow JS API · row access

# Inspect one row without rebuilding the table.

Row values are the row-level view returned by Table, RecordBatch, and Struct vectors. Use names or indexes for inspection, then convert explicitly when a plain object or array is needed.

[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)[RecordBatch](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

The Row model

## Use a row for inspection, not as the storage model.

Arrow stores columns and batches, then provides a row proxy when application code needs record-shaped access. Keep column operations columnar and materialize rows only at a boundary that needs them.

01

Access

Index or field name

02

Iteration

Entries through the row iterator

03

Conversion

toArray, toJSON, and toString

04

Source

Table rows, RecordBatch rows, or Struct vectors

Detailed guide

## Row and StructRow reference

The sections below document row methods, iteration, field access, and the relationship between row proxies and columnar storage.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

A `Row` is the row-level object returned by nested `Struct` vectors and by `Table`/`RecordBatch` row access. Rows are proxies over the underlying struct data, keyed by field name. Updates through a row proxy affect that data; convert with `toJSON()` when a separate plain object is needed.

## Usage[​](#usage "Direct link to Usage")

```
import {vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';



const rows = vectorFromArray(

  [

    {id: 1, value: 'foo'},

    {id: 2, value: 'bar'}

  ],

  new Struct([new Field('id', new Int32()), new Field('value', new Utf8())])

);



const row = rows.get(0);

console.log(row?.[0], row?.id, row?.value);
```

```
import {vectorFromArray, Struct, Field, Utf8, Int32} from 'apache-arrow';



const names = vectorFromArray(

  [

    {id: 1, name: 'Alice'},

    {id: 2, name: 'Bob'}

  ],

  new Struct([new Field('id', new Int32()), new Field('name', new Utf8())])

);



for (const row of names) {

  console.log(row.id, row.size, row.toString());

}
```

## StructRow methods[​](#structrow-methods "Direct link to StructRow methods")

* `toArray(): T[string]["TValue"][]` — Materializes row fields to a plain array.
* `toJSON(): { [P in string & keyof T]: T[P]["TValue"]; }` — Returns row values as a JSON object.
* `toString(): string` — Returns a debug string.
* `[Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]['TValue'] | null]>` — Iterates `[key, value]` entries.
* `size: number` — Number of fields in the row.

Rows can also be used directly in `for...of`, bracket access, and property-style access.
