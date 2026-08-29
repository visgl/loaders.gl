---
title: Struct vectors
description: Work with structured Arrow rows through Vector<Struct> and row proxies.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · structured values"
  title="Keep nested records columnar too."
  description="Modern Arrow JS represents structured values as Vector<Struct> rather than a separate public StructVector class. Child vectors remain addressable, while row proxies provide convenient record-shaped access."
  tone="violet"
  meta={['Vector<Struct>', 'Nested child columns', 'StructRow proxies']}
  links={[
    {label: 'Vector', to: '/docs/arrowjs/api-reference/vector'},
    {label: 'Row', to: '/docs/arrowjs/api-reference/row'},
    {label: 'Data types', to: '/docs/arrowjs/api-reference/types'}
  ]}
/>

<DocOrientation
  eyebrow="The structured-vector path"
  title="Choose columns for processing or rows for inspection."
  description="A struct vector keeps child fields as Arrow vectors and exposes a row proxy only when convenient. This preserves typed nested storage without forcing application code to rebuild objects."
  tone="violet"
  items={[
    {label: 'Modern type', value: 'Vector<Struct<...>>'},
    {label: 'Child access', value: 'getChild(name or index)'},
    {label: 'Row access', value: 'get, at, and row property names'},
    {label: 'Materialization', value: 'toArray returns row proxies for inspection'}
  ]}
/>

<ReferenceBoundary
  title="Structured vector reference"
  description="The sections below document construction, child vectors, row access, and the migration away from the historical StructVector class."
  tone="violet"
/>

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
