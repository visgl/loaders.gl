# StructVector

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

`StructVector` is no longer exposed as a separate public class in Apache Arrow JS v21.
Structured values are represented by `Vector<Struct<...>>`, and row-level access is delivered through `StructRow`/`StructRowProxy`.

## Usage

```ts
import {vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';

const rows = vectorFromArray(
  [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'}
  ],
  new Struct([new Field('id', new Int32()), new Field('name', new Utf8())])
);

console.log(rows.get(0)?.name);
```

## Accessing structured data

Use `get` / `at` / `set` on the vector to access row objects.

- `get(index)` / `at(index)` returns a row proxy.
- `getChild(name | index)` returns nested child vectors.
- `toArray()` returns row proxies for each row.

```ts
import {vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';

const rows = vectorFromArray(
  [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'}
  ],
  new Struct([new Field('id', new Int32()), new Field('name', new Utf8())])
);

const first = rows.get(0);
console.log(first?.name);
```
