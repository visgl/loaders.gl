Schema module · table API

# Table

A loaders.gl table describes data independently of the format that produced it. Choose row, columnar, GeoJSON, or Arrow-backed data at the application boundary.

[Schema module](https://loaders.gl/next/docs/modules/core/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema.md)[Table guide](https://loaders.gl/next/docs/modules/core/schema/table-guide.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema/table-guide.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The table family

## One application path, several useful representations.

Loaders can return a shape that matches the next operation without changing the meaning of the data. A discriminated \`shape\` field makes the representation explicit at runtime.

01

Object rows

Readable records for application code

02

Array rows

Compact records with positional fields

03

Columnar

Columns without row-object overhead

04

Arrow

Typed columns and batch interoperability

Detailed guide

## Table API reference

The sections below describe table shapes, schemas, and utilities that operate across representations.

loaders.gl defines a number of table types.

* `ObjectRowTable`
* `ArrayRowTable`
* `GeoJSONTable`
* `ColumnarTable`
* `ArrowTable`

These all have a `shape` field on the top level.

(If you are an advanced TypeScript programmer, you will appreciate that this lets typescript treat table types as a "discriminated union", meaning that once the type has been checked in an if or switch statement, the typing of the table is implied).

## Table Schemas[​](#table-schemas "Direct link to Table Schemas")

Each table has an optional `schema` field. If it is present, it contains a list of fields (name, type and metadata for each field), as well as metadata for the table itself.

There are also utilities for deducing schemas.

## Table Utilities[​](#table-utilities "Direct link to Table Utilities")

A set of utilities are provided to work with tables independently of which of the supported representations they are in.

* \`tableLength\`\`
* ...
