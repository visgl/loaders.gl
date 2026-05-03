# Table And Arrow Converters

These converters move between loaders.gl table wrappers and Apache Arrow tables.

## TableConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/schema-utils` |
| `id` | `'table'` |
| `from` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| `to` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| Detection | Reads `input.shape` on loaders.gl table wrappers |
| Typical use | Normalize one loaders.gl wrapper into another |

`TableConverter` is the wrapper-to-wrapper bridge. It does not deal with raw Apache Arrow `Table` instances.

## ArrowConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/arrow` |
| `id` | `'arrow'` |
| `from` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| `to` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| Detection | Treats raw Apache Arrow `Table` instances as `'arrow'` |
| Typical use | Bridge raw Arrow tables into loaders.gl wrappers, or write wrappers back to Arrow |

## Shape Mapping

| Shape | Meaning |
| --- | --- |
| `'arrow'` | Raw Apache Arrow `Table` |
| `'arrow-table'` | loaders.gl wrapper around Arrow table data |
| `'object-row-table'` | Array of row objects |
| `'array-row-table'` | Array of row arrays |
| `'columnar-table'` | Column-oriented loaders.gl wrapper |
| `'geojson-table'` | loaders.gl table wrapper specialized for GeoJSON-like rows |

## Common Pattern

```ts
import {convert, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';

const objectRows = convert(arrowTable, 'object-row-table', [ArrowConverter, TableConverter]);
const rawArrow = convert(objectRows, 'arrow', [TableConverter, ArrowConverter]);
```

## When To Stop At Arrow

If your downstream consumer already speaks Arrow, stop at `'arrow'`.

If your downstream code wants loaders.gl table helpers or a normalized wrapper shape, continue through `TableConverter`.
