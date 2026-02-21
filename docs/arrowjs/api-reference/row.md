# Row

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A `Row` is the row-level object returned by nested `Struct` vectors and by `Table`/`RecordBatch` row access. Rows behave like read-only tuples keyed by index and field name.

## Usage

```ts
import {makeVector, Struct, Field, Int32, Utf8} from 'apache-arrow';

const rows = makeVector(
  [
    {id: 1, value: 'foo'},
    {id: 2, value: 'bar'}
  ],
  new Struct([new Field('id', new Int32()), new Field('value', new Utf8())])
);

const row = rows.get(0);
console.log(row?.[0], row?.id, row?.value);
```

```ts
import {makeVector, Struct, Field, Utf8, Int32} from 'apache-arrow';

const names = makeVector(
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

## StructRow API

## Methods

- `toArray(): T[string]["TValue"][]` — Materializes row fields to a plain array.
- `toJSON(): { [P in string & keyof T]: T[P]["TValue"]; }` — Returns row values as a JSON object.
- `toString(): string` — Returns a debug string.
- `[Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]['TValue'] | null]>` — Iterates `[key, value]` entries.
- `size: number` — Number of fields in the row.

Rows can also be used directly in `for...of`, bracket access, and property-style access.
