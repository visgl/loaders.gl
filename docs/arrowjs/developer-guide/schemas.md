---
title: Arrow JavaScript schemas
description: Describe table columns with names, types, nullability, and metadata before consuming their values.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · schemas"
  title="Let the schema tell you what the buffers mean."
  description="An Arrow Schema is the compact contract for a table or record batch: fields name the columns, types describe their logical values, and metadata carries the context that applications should not have to infer."
  tone="cyan"
  meta={['Fields', 'Types and nullability', 'Metadata']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'Schema API', to: '/docs/arrowjs/api-reference/schema'},
    {label: 'Field API', to: '/docs/arrowjs/api-reference/field'}
  ]}
/>

<DocOrientation
  eyebrow="The schema contract"
  title="Names, types, and metadata travel with the data."
  description="Schemas make a table self-describing, including nested fields inside list, struct, and map types. A consumer can inspect the shape before choosing how to render, transform, or export it."
  tone="cyan"
  items={[
    {label: 'Field', value: 'Name, logical type, nullability, and metadata'},
    {label: 'Schema', value: 'An ordered collection of fields and table metadata'},
    {label: 'Nested', value: 'Child fields for list, struct, and map values'},
    {label: 'Used by', value: 'Tables and record batches alike'}
  ]}
/>

<ReferenceBoundary
  title="Schema details"
  description="The examples below cover schema inspection, field types, nullability, metadata, and nested Arrow data types."
  tone="cyan"
/>

# Schemas

The `Schema` class stores a list of `Field` instances that provide
information about the columns in a table: name, data type and nullability.

A `Schema` can also contain metadata, both on the table level and on each Field.

Every `Table` and `RecordBatch` contains a `Schema` instance.

:::info
Note that since Arrow allows for composite columns (`List`, `Struct`, `Map_` etc),
data types can contain nested `Field` objects.
:::

### Create a new Schema

### Working with Arrow Schemas

Get the names of the columns in a table.

```typescript
const fieldNames = table.schema.fields.map((f) => f.name);
// Array(3) ["Latitude", "Longitude", "Date"]
```

```typescript
const fieldTypes = schema.fields.map(f => f.type)
// Array(3) [Float, Float, Timestamp]

const fieldTypeNames = ...;
// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]
```
