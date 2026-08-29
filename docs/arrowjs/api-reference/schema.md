---
title: Schema
description: Describe the fields, types, nullability, and metadata shared by Arrow columns.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · schema"
  title="Make the table’s contract explicit."
  description="Schema is the ordered description of an Arrow table, record batch, or record. It names each field, declares its DataType and nullability, and carries metadata that should survive serialization."
  tone="cyan"
  meta={['Ordered fields', 'Types and nullability', 'Schema metadata']}
  links={[
    {label: 'Field', to: '/docs/arrowjs/api-reference/field'},
    {label: 'Data types', to: '/docs/arrowjs/api-reference/types'},
    {label: 'Table', to: '/docs/arrowjs/api-reference/table'}
  ]}
/>

<DocOrientation
  eyebrow="The Schema model"
  title="Describe columns before moving their values."
  description="A schema lets readers, writers, builders, and applications agree on names and types independently of the physical batches that carry the values."
  tone="cyan"
  items={[
    {label: 'Fields', value: 'Ordered Field descriptors for each column'},
    {label: 'Types', value: 'Primitive, nested, temporal, and dictionary types'},
    {label: 'Nullability', value: 'Whether a field may contain null values'},
    {label: 'Metadata', value: 'String key/value annotations and dictionaries'}
  ]}
/>

<ReferenceBoundary
  title="Schema reference"
  description="The sections below document construction, fields, metadata, dictionaries, selection, assignment, and schema compatibility."
  tone="cyan"
/>

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Sequence of arrow `Field` objects describing columns in a table, batch, or record.

## Usage

```ts
import {Schema, Field, Int32, Utf8} from 'apache-arrow';

const schema = new Schema([
  new Field('id', new Int32(), false),
  new Field('name', new Utf8(), true)
]);

const selected = schema.select(['id']);
console.log(selected.names, schema.names.length);
```

```ts
import {Schema, Field, Int32, Float64} from 'apache-arrow';

const first = new Schema([new Field('a', new Int32())]);
const merged = first.assign(new Schema([new Field('b', new Float64())]));
console.log(merged.names);
```

## Members

### `fields: Field[]`

Ordered field list for the schema.

### `metadata: Map<string, string>`

Optional schema-level metadata.

### `dictionaries: Map<number, DataType>`

Dictionary id to dictionary type map extracted from nested dictionary fields.

### `metadataVersion: MetadataVersion`

Schema metadata serialization version.

### `names: (keyof T)[]`

Column names in schema order.

## Methods

### `constructor(fields: Field<T[keyof T]>[] = [], metadata: Map<string, string> | null = null, dictionaries: Map<number, DataType> | null = null, metadataVersion: MetadataVersion = MetadataVersion.V4)`

Constructs a schema from fields and optional metadata.

### `select<K extends keyof T = any>(fieldNames: K[]): Schema<{ [P in K]: T[P] }>`

Returns a new schema containing only selected field names.

### `selectAt<K extends T = any>(fieldIndices: number[]): Schema<K>`

Returns a new schema containing fields at selected indices.

### `assign<R extends TypeMap = any>(schema: Schema<R>): Schema<T & R>`

### `assign<R extends TypeMap = any>(...fields: (Field<R[keyof R]> | Field<R[keyof R]>[])[]): Schema<T & R>`

Merges this schema with another schema or one or more fields and returns a new schema.

### `toString(): string`

Returns a short schema preview.

### `[Symbol.toStringTag]: string`

Returns `'Schema'`.
