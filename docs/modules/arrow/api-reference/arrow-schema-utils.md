---
title: Arrow Schema Utilities
description: Validate Arrow schemas and rename columns without leaving the vector representation.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow schema utilities"
  title="Make table contracts explicit at the boundary."
  description="These helpers validate Apache Arrow JS table schemas and rename selected fields while preserving vectors and untouched columns. They are useful when a loader or source needs a clear contract before handing data to the next stage."
  tone="cyan"
  meta={['Apache Arrow', 'Schema validation', 'Vector-preserving rename']}
  links={[
    {label: 'Arrow module', to: '/docs/modules/arrow'},
    {label: 'Arrow data model', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'Table category', to: '/docs/specifications/category-table'}
  ]}
/>

<DocOrientation
  eyebrow="The schema boundary"
  title="Check the shape. Adapt names. Keep the data buffers."
  description="Schema utilities sit between format-specific input and application code: they make mismatches visible and avoid unnecessary conversion when only field names need to change."
  tone="cyan"
  items={[
    {label: 'Validate', value: 'Field order, names, and Arrow type IDs'},
    {label: 'Adapt', value: 'Rename selected fields against a target schema'},
    {label: 'Preserve', value: 'Vectors, buffers, and unmapped columns'},
    {label: 'Result', value: 'A typed Arrow table for downstream code'}
  ]}
/>

The Arrow schema utilities help validate Apache Arrow JS tables at runtime and rename columns while
preserving Arrow vectors.

Use these helpers when integrating Arrow-backed APIs or data sources where the incoming table
schema should be checked before downstream code relies on typed field names.

<ReferenceBoundary
  title="Validation and rename details"
  description="The reference below covers expected schemas, extra-field policy, field mappings, type checks, and error behavior."
  tone="cyan"
/>

## `validateArrowTableSchema`

Validates that an Arrow table matches an expected schema by field order, field name, and Arrow type
id.

```typescript
import * as arrow from 'apache-arrow';
import {validateArrowTableSchema} from '@loaders.gl/arrow';

const expectedSchema = new arrow.Schema([
  new arrow.Field('record_id', new arrow.Utf8(), false),
  new arrow.Field('score', new arrow.Float64(), true)
]);

const typedTable = validateArrowTableSchema(table, expectedSchema, {
  schemaName: 'records table'
});
```

### Parameters

- `table`: Arrow table to validate.
- `expectedSchema`: expected Arrow schema.
- `options.rejectExtraFields`: reject fields that are present in the table but not in the expected
  schema. Defaults to `false`.
- `options.schemaName`: human-readable schema name included in validation errors.

### Behavior

- Extra trailing fields are accepted by default so consumers can tolerate additive schema changes.
- Missing expected fields are rejected.
- Fields in the wrong order are rejected.
- Field name mismatches are rejected.
- Field Arrow `typeId` mismatches are rejected.
- On success, the input table is returned and narrowed to `arrow.Table<T>`.

Use strict validation when an exact field set matters:

```typescript
validateArrowTableSchema(table, expectedSchema, {
  rejectExtraFields: true,
  schemaName: 'strict records table'
});
```

## `renameArrowColumns`

Validates an Arrow table against a source schema, then renames selected columns to fields defined in
a target schema while preserving any untouched source columns.

This is useful for converting wire-format field names such as `record_id` and `item_count` into
JavaScript-oriented field names such as `recordId` and `itemCount`.

```typescript
import * as arrow from 'apache-arrow';
import {renameArrowColumns} from '@loaders.gl/arrow';

const sourceSchema = new arrow.Schema([
  new arrow.Field('record_id', new arrow.Utf8(), false),
  new arrow.Field('item_count', new arrow.Float64(), true),
  new arrow.Field('source_flag', new arrow.Bool(), true)
]);

const targetSchema = new arrow.Schema([
  new arrow.Field('recordId', new arrow.Utf8(), false),
  new arrow.Field('itemCount', new arrow.Float64(), true)
]);

const renamedTable = renameArrowColumns(table, sourceSchema, targetSchema, {
  record_id: 'recordId',
  item_count: 'itemCount'
});

renamedTable.schema.fields.map((field) => field.name);
// ['recordId', 'itemCount', 'source_flag']
```

### Parameters

- `table`: Arrow table to validate and rename.
- `sourceSchema`: expected schema for the input table.
- `targetSchema`: schema that defines renamed field names and their expected types.
- `fieldNameMap`: source-to-target field name mapping.

### Behavior

- The input table is validated against `sourceSchema` before renaming.
- Only fields listed in `fieldNameMap` are renamed.
- Unmapped source fields are preserved with their original names and field definitions.
- Renamed fields use matching field definitions from `targetSchema`.
- The helper rejects duplicate output field names.
- The helper rejects renamed fields whose target type does not match the source column type.
