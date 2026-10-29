Arrow JS API · structured values

# Keep nested records columnar too.

Modern Arrow JS represents structured values as Vector\<Struct> rather than a separate public StructVector class. Child vectors remain addressable, while row proxies provide convenient record-shaped access.

[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Row](https://loaders.gl/next/docs/arrowjs/api-reference/row.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/row.md)[Data types](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

The structured-vector path

## Choose columns for processing or rows for inspection.

A struct vector keeps child fields as Arrow vectors and exposes a row proxy only when convenient. This preserves typed nested storage without forcing application code to rebuild objects.

01

Modern type

Vector\<Struct<...>>

02

Child access

getChild(name) or getChildAt(index)

03

Row access

get, at, and row property names

04

Materialization

toArray returns row proxies for inspection

Detailed guide

## Structured vector reference

The sections below document construction, child vectors, row access, and the migration away from the historical StructVector class.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

`StructVector` is no longer exposed as a separate public class in Apache Arrow JS v21. Structured values are represented by `Vector<Struct<...>>`, and row-level access is delivered through `StructRow`/`StructRowProxy`.

## Usage[​](#usage "Direct link to Usage")

```
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

## Accessing structured data[​](#accessing-structured-data "Direct link to Accessing structured data")

Use `get` / `at` / `set` on the vector to access row objects.

* `get(index)` / `at(index)` returns a row proxy.
* `getChild(name)` / `getChildAt(index)` returns nested child vectors.
* `toArray()` returns row proxies for each row.

```
const first = rows.get(0);

console.log(first?.name);

const names = rows.getChild('name');

console.log(names?.get(0));
```
