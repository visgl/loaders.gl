# Table

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



