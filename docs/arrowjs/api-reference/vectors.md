# Vectors and Vector Types

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Vector construction is centered on the `Vector` class; Arrow no longer publishes long-lived public classes such as `Int32Vector`.

## Usage

```ts
import {makeVector, Int32Array} from 'apache-arrow';

const ids = makeVector(new Int32Array([1, 2, 3]));
console.log(ids.length, ids.get(0));
```

```ts
import {vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';

const rows = vectorFromArray(
  [{id: 1, label: 'alpha'}],
  new Struct([new Field('id', new Int32()), new Field('label', new Utf8())])
);
```

## Factory functions

- `makeVector<T extends TypedArray | BigIntArray>(data: T | readonly T[]): Vector`
- `makeVector<T extends DataView>(data: T | readonly T[]): Vector`
- `makeVector<T extends DataType>(data: Data<T> | readonly Data<T>[] | Vector<T> | readonly Vector<T>[] | DataProps<T> | readonly DataProps<T>[]): Vector<T>`
- `vectorFromArray(values: readonly unknown[], type?: DataType): Vector`
- `vectorFromArray<T extends readonly unknown[]>(values: T): Vector`

## Factory function behavior

- `makeVector` prefers typed-array input and zero-copy semantics when possible.
- `vectorFromArray` infers Arrow types from plain JS input and accepts optional explicit type overrides.

```ts
import {makeVector, vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';

const a = makeVector(new Int32Array([1, 2, 3]));
const b = vectorFromArray(['a', 'b', 'c']);
const rows = vectorFromArray(
  [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'}
  ],
  new Struct([new Field('id', new Int32()), new Field('name', new Utf8())])
);
```

## Supported type families

`Vector` is shared across all Arrow logical type families:

- Null and boolean
- Integer and floating point
- Binary and text (`Binary`, `Utf8`, `LargeBinary`, `LargeUtf8`)
- Fixed-size list, list, struct, and map
- Temporal (`Date*`, `Time*`, `Timestamp*`)
- Interval, duration, dictionary, and union

For a full list of concrete `DataType` classes, see [`types.md`](/docs/arrowjs/api-reference/types).
