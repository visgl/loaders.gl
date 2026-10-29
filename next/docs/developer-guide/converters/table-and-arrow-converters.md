Data conversion

# Keep the table shape explicit as data moves.

The table and Arrow converters bridge loaders.gl wrappers and raw Apache Arrow tables. They let an application choose a convenient shape at each boundary without confusing a wrapper with the underlying table data.

[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

Shape is part of the contract

## Convert at the boundary, not by accident.

A raw Arrow table, a loaders.gl Arrow wrapper, a columnar table, and an array of row objects can all describe the same records. The converters make the transition deliberate.

01

Raw Arrow

shape: 'arrow' for Apache Arrow JS tables

02

Arrow wrapper

shape: 'arrow-table' for loaders.gl APIs

03

Other shapes

Rows, columnar tables, and GeoJSON-like tables

04

Use it for

Normalization before rendering, scanning, or writing

These converters move between loaders.gl table wrappers and Apache Arrow tables.

Detailed guide

## Converter details

The sections below document the two converter families and their supported shape mappings.

## TableConverter[​](#tableconverter "Direct link to TableConverter")

| Field       | Value                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| Package     | `@loaders.gl/core/schema-utils`                                                |
| `id`        | `'table'`                                                                      |
| `from`      | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| `to`        | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| Detection   | Reads `input.shape` on loaders.gl table wrappers                               |
| Typical use | Normalize one loaders.gl wrapper into another                                  |

`TableConverter` is the wrapper-to-wrapper bridge. It does not deal with raw Apache Arrow `Table` instances.

## ArrowConverter[​](#arrowconverter "Direct link to ArrowConverter")

| Field       | Value                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Package     | `@loaders.gl/tables/arrow`                                                                                   |
| `id`        | `'arrow'`                                                                                                    |
| `from`      | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| `to`        | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| Detection   | Treats raw Apache Arrow `Table` instances as `'arrow'`                                                       |
| Typical use | Bridge raw Arrow tables into loaders.gl wrappers, or write wrappers back to Arrow                            |

## Shape Mapping[​](#shape-mapping "Direct link to Shape Mapping")

| Shape                | Meaning                                                    |
| -------------------- | ---------------------------------------------------------- |
| `'arrow'`            | Raw Apache Arrow `Table`                                   |
| `'arrow-table'`      | loaders.gl wrapper around Arrow table data                 |
| `'object-row-table'` | Array of row objects                                       |
| `'array-row-table'`  | Array of row arrays                                        |
| `'columnar-table'`   | Column-oriented loaders.gl wrapper                         |
| `'geojson-table'`    | loaders.gl table wrapper specialized for GeoJSON-like rows |

## Common Pattern[​](#common-pattern "Direct link to Common Pattern")

```
import {convert, TableConverter} from '@loaders.gl/core/schema-utils';

import {ArrowConverter} from '@loaders.gl/tables/arrow';



const objectRows = convert(arrowTable, 'object-row-table', [ArrowConverter, TableConverter]);

const rawArrow = convert(objectRows, 'arrow', [TableConverter, ArrowConverter]);
```

## When To Stop At Arrow[​](#when-to-stop-at-arrow "Direct link to When To Stop At Arrow")

If your downstream consumer already speaks Arrow, stop at `'arrow'`.

If your downstream code wants loaders.gl table helpers or a normalized wrapper shape, continue through `TableConverter`.
