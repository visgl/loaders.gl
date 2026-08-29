---
title: Table
description: The common table shapes returned by loaders.gl loaders.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Schema module · table API"
  title="Table"
  description="A loaders.gl table describes data independently of the format that produced it. Choose row, columnar, GeoJSON, or Arrow-backed data at the application boundary."
  tone="cyan"
  meta={['Common result contract', 'Five table shapes', 'Optional schema']}
  links={[
    {label: 'Schema module', to: '/docs/modules/schema'},
    {label: 'Table guide', to: '/docs/modules/schema/table-guide'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The table family"
  title="One application path, several useful representations."
  description="Loaders can return a shape that matches the next operation without changing the meaning of the data. A discriminated `shape` field makes the representation explicit at runtime."
  tone="cyan"
  items={[
    {label: 'Object rows', value: 'Readable records for application code'},
    {label: 'Array rows', value: 'Compact records with positional fields'},
    {label: 'Columnar', value: 'Columns without row-object overhead'},
    {label: 'Arrow', value: 'Typed columns and batch interoperability'}
  ]}
/>

<ReferenceBoundary
  title="Table API reference"
  description="The sections below describe table shapes, schemas, and utilities that operate across representations."
  tone="cyan"
/>

loaders.gl defines a number of table types.

- `ObjectRowTable`
- `ArrayRowTable`
- `GeoJSONTable`
- `ColumnarTable`
- `ArrowTable`

These all have a `shape` field on the top level.

(If you are an advanced TypeScript programmer, you will appreciate that this lets typescript treat table types as a "discriminated union", meaning that once the type has been checked in an if or switch statement, the typing of the table is implied).

## Table Schemas

Each table has an optional `schema` field. If it is present, it contains a list of fields (name, type and metadata for each field), as well as metadata for the table itself.

There are also utilities for deducing schemas.

## Table Utilities

A set of utilities are provided to work with tables independently of which of the supported representations they are in.

- `tableLength``
- ...
