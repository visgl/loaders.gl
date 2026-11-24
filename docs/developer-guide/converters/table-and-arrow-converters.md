Data conversion

# Keep the table shape explicit as data moves.

The table and Arrow converters bridge native Apache Arrow tables and loaders.gl row, columnar, and GeoJSON tables.

[Arrow format](https://loaders.gl/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/tables/arrow/formats/arrow.md)[Loader categories](https://loaders.gl/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/docs/developer-guide/loader-categories.md)

Shape is part of the contract

## Convert at the boundary, not by accident.

A native Arrow table, a columnar table, and an array of row objects can all describe the same records. The converters make the transition deliberate.

01

Raw Arrow

shape: 'arrow' for Apache Arrow JS tables

02

Arrow output

shape: 'arrow' returns a native table

03

Other shapes

Rows, columnar tables, and GeoJSON-like tables

04

Use it for

Normalization before rendering, scanning, or writing

These converters move between loaders.gl row, columnar, and GeoJSON table shapes and native Apache Arrow tables.

Detailed guide

## Converter details

The sections below document the two converter families and their supported shape mappings.

## TableConverter[​](#tableconverter "Direct link to TableConverter")

| Field       | Value                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| Package     | `@loaders.gl/core/schema-utils`                                               |
| `id`        | `'table'`                                                                     |
| `from`      | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow'`      |
| `to`        | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow'`      |
| Detection   | Recognizes native tables and reads `input.shape` on loaders.gl table wrappers |
| Typical use | Convert between native Arrow and loaders.gl row or column tables              |

`TableConverter` can convert native Arrow directly to row or column tables and back.

## ArrowConverter[​](#arrowconverter "Direct link to ArrowConverter")

| Field       | Value                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- |
| Package     | `@loaders.gl/tables/arrow`                                                                  |
| `id`        | `'arrow'`                                                                                   |
| `from`      | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'` |
| `to`        | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'` |
| Detection   | Treats raw Apache Arrow `Table` instances as `'arrow'`                                      |
| Typical use | Convert between native Arrow and row, columnar, or GeoJSON tables                           |

## Shape Mapping[​](#shape-mapping "Direct link to Shape Mapping")

| Shape                | Meaning                                                    |
| -------------------- | ---------------------------------------------------------- |
| `'arrow'`            | Raw Apache Arrow `Table`                                   |
| `'object-row-table'` | Array of row objects                                       |
| `'array-row-table'`  | Array of row arrays                                        |
| `'columnar-table'`   | Column-oriented loaders.gl wrapper                         |
| `'geojson-table'`    | loaders.gl table wrapper specialized for GeoJSON-like rows |

## Common Pattern[​](#common-pattern "Direct link to Common Pattern")

```
import {convert, TableConverter} from '@loaders.gl/core/schema-utils';

const objectRows = convert(arrowTable, 'object-row-table', TableConverter);

const rawArrow = convert(objectRows, 'arrow', TableConverter);
```

## When To Stop At Arrow[​](#when-to-stop-at-arrow "Direct link to When To Stop At Arrow")

If your downstream consumer already speaks Arrow, stop at `'arrow'`.

If your downstream code wants loaders.gl table helpers or a normalized wrapper shape, continue through `TableConverter`.
