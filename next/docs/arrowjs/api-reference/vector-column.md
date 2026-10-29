Arrow JS API · migration

# Replace legacy Column access with Vector.

Column is a historical Arrow JS name. Modern v21+ code reads a table column through Vector and Table.getChild(), preserving the same typed, chunk-aware data model.

[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)[Arrow JS reference](https://loaders.gl/next/docs/arrowjs/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference.md)

Migration at a glance

## Change the accessor, keep the column meaning.

The data remains a typed Arrow column. The modern API makes the table and vector boundary explicit instead of relying on a separate Column class name.

01

Old mental model

Column or getColumn()

02

Modern model

Vector returned by Table.getChild()

03

Indexed access

Use getChildAt(index) when position is known

04

Related guide

See the table and vector pages for full APIs

Detailed guide

## Column migration reference

The sections below show the modern accessor pattern and map historical Column examples to the current Vector API.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

`Column` is a legacy name in Arrow JS API history. In modern v21 documentation, table column access uses `Vector` and `Table.getChild()`.

## Usage[​](#usage "Direct link to Usage")

```
import {tableFromJSON} from 'apache-arrow';



const table = tableFromJSON([

  {origin_lat: 12.3, origin_lon: 45.6},

  {origin_lat: 22.1, origin_lon: 55.2}

]);



const latitudes = table.getChild('origin_lat');

console.log(latitudes?.get(0));
```

## Migration note[​](#migration-note "Direct link to Migration note")

Use `table.getChild(name)` (or `table.getChildAt(index)`) instead of `table.getColumn(...)` when reading columns.

```
const latitudes = table.getChild('origin_lat');

const first = latitudes?.get(0);
```

When a single API compatibility page is needed, older examples referencing `Column` should map them to `Vector`.
