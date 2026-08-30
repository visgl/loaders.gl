---
title: Field
description: Describe one named Arrow column with its type, nullability, and metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · schema component"
  title="A Field gives one column a name and a contract."
  description="Field pairs a column name with its DataType, nullability, and optional metadata. Schemas use ordered fields to describe the columns in tables, record batches, and nested structures."
  tone="cyan"
  meta={['Name and type', 'Nullability', 'Field metadata']}
  links={[
    {label: 'Schema', to: '/docs/arrowjs/api-reference/schema'},
    {label: 'Data types', to: '/docs/arrowjs/api-reference/types'},
    {label: 'Table', to: '/docs/arrowjs/api-reference/table'}
  ]}
/>

<DocOrientation
  eyebrow="The Field model"
  title="Give every column a stable meaning."
  description="Fields are the small schema units that let Arrow readers, builders, and writers agree on how to interpret a column before values are accessed."
  tone="cyan"
  items={[
    {label: 'Name', value: 'The stable column identifier'},
    {label: 'Type', value: 'The logical Arrow DataType'},
    {label: 'Nullability', value: 'Whether null values are permitted'},
    {label: 'Metadata', value: 'Optional string annotations for consumers'}
  ]}
/>

<ReferenceBoundary
  title="Field reference"
  description="The sections below document members, constructors, Field.new, cloning, metadata, and type relationships."
  tone="cyan"
/>

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A `Field` is a named column component with type and nullability metadata.

## Usage

```ts
import {Field, Int32} from 'apache-arrow';

const id = Field.new({name: 'id', type: new Int32(), nullable: false});
const cloned = id.clone({nullable: true});
```

## Members

### `name: string`

Field name.

### `type: DataType`

Field data type.

### `nullable: boolean`

Whether null values are permitted.

### `metadata: Map<string, string>`

Optional field metadata.

### `typeId: Type`

The underlying `DataType` identifier.

### `readonly [Symbol.toStringTag]: string`

Debug name shown by `Object.prototype.toString`.

## Static methods

### `Field.new<T extends DataType = any>(props: { name: string | number; type: T; nullable?: boolean; metadata?: Map<string, string> | null }): Field<T>`

### `Field.new<T extends DataType = any>(name: string | number | Field<T>, type: T, nullable?: boolean, metadata?: Map<string, string> | null): Field<T>`

Creates a field with explicit constructor arguments.

## Constructor

### `constructor(name: string, type: DataType, nullable = false, metadata?: Map<string, string> | null)`

Creates a new immutable field descriptor.

## Methods

### `clone<T extends DataType = any>(props: { name?: string | number; type?: T; nullable?: boolean; metadata?: Map<string, string> | null }): Field<T>`

Returns a copy with overridden metadata.

### `clone<R extends DataType = any>(name?: string | number | Field<T>, type?: R, nullable?: boolean, metadata?: Map<string, string> | null): Field<R>`

Returns a copy with overridden properties.

### `toString(): string`

Returns a concise string representation of the field.
