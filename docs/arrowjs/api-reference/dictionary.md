# Dictionary

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A `Dictionary` `DataType` that describes dictionary-encoded values (index + dictionary lookup table).

## Usage

```ts
import {Dictionary, Utf8, Int32} from 'apache-arrow';

const type = new Dictionary(new Utf8(), new Int32());
console.log(type.isOrdered, type.id);
```

```ts
import {Dictionary, Utf8, Int32} from 'apache-arrow';

const type = new Dictionary(new Utf8(), new Int32());
console.log(type.toString());
```

## Members

- `id: bigint | number | null` — Dictionary type identifier used in message metadata.
- `indices: TKey` — Integer index key type (`Int8`, `Int16`, `Int32`, `Uint8`, `Uint16`, `Uint32`).
- `dictionary: T` — Logical value type of the dictionary payload.
- `isOrdered: boolean` — Whether dictionary index values are order-preserving.
- `children: Field[]` — Nested field descriptors (inherited from `DataType`).
- `valueType: T` — Alias for `dictionary`.
- `ArrayType: T['ArrayType']` — Value array constructor for dictionary index type.
- `typeId: Type.Dictionary` — Data type enum value for this type.

## Constructor

### `constructor(dictionary: T, indices: TKey, id?: bigint | number | null, isOrdered?: boolean | null)`

Construct a dictionary type with explicit dictionary values and index type.

## Methods

- `toString(): string` — Returns canonical `"Dictionary<...>"` representation.
