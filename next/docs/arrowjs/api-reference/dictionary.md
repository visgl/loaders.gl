Arrow JS API · encoded type

# Store repeated values through a shared dictionary.

Dictionary describes a column whose physical values are integer indices into a logical dictionary. It can reduce repeated text or categorical values while retaining the original value type for readers.

[Data types](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)[Schema](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)[Data](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)

The Dictionary model

## Separate the repeated value from its index.

A dictionary type names both the logical value type and the integer index type. The encoding is most useful for repeated values, while the schema carries the dictionary identity needed for serialization.

01

Logical value

The type stored in the dictionary

02

Index

An integer type pointing into dictionary values

03

Identity

Dictionary id carried in message metadata

04

Ordering

Optional flag for order-preserving indices

Detailed guide

## Dictionary type reference

The sections below document constructor arguments, members, dictionary ids, index types, and string representation.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

A `Dictionary` `DataType` that describes dictionary-encoded values (index + dictionary lookup table).

## Usage[​](#usage "Direct link to Usage")

```
import {Dictionary, Utf8, Int32} from 'apache-arrow';



const type = new Dictionary(new Utf8(), new Int32());

console.log(type.isOrdered, type.id);
```

```
import {Dictionary, Utf8, Int32} from 'apache-arrow';



const type = new Dictionary(new Utf8(), new Int32());

console.log(type.toString());
```

## Members[​](#members "Direct link to Members")

* `id: bigint | number | null` — Dictionary type identifier used in message metadata.
* `indices: TKey` — Integer index key type (`Int8`, `Int16`, `Int32`, `Uint8`, `Uint16`, `Uint32`).
* `dictionary: T` — Logical value type of the dictionary payload.
* `isOrdered: boolean` — Whether dictionary index values are order-preserving.
* `children: Field[]` — Nested field descriptors (inherited from `DataType`).
* `valueType: T` — Alias for `dictionary`.
* `ArrayType: T['ArrayType']` — Value array constructor for dictionary index type.
* `typeId: Type.Dictionary` — Data type enum value for this type.

## Constructor[​](#constructor "Direct link to Constructor")

### `constructor(dictionary: T, indices: TKey, id?: bigint | number | null, isOrdered?: boolean | null)`[​](#constructordictionary-t-indices-tkey-id-bigint--number--null-isordered-boolean--null "Direct link to constructordictionary-t-indices-tkey-id-bigint--number--null-isordered-boolean--null")

Construct a dictionary type with explicit dictionary values and index type.

## Methods[​](#methods "Direct link to Methods")

* `toString(): string` — Returns canonical `"Dictionary<...>"` representation.
