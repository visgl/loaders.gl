# Column

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

`Column` is a legacy name in Arrow JS API history. In modern v21 documentation, table column access uses `Vector` and `Table.getChild()`.

## Usage

```ts
import {tableFromJSON} from 'apache-arrow';

const table = tableFromJSON([
  {origin_lat: 12.3, origin_lon: 45.6},
  {origin_lat: 22.1, origin_lon: 55.2}
]);

const latitudes = table.getChild('origin_lat');
console.log(latitudes?.get(0));
```

## Migration note

Use `table.getChild(name)` (or `table.getChildAt(index)`) instead of `table.getColumn(...)` when reading columns.

```ts
const latitudes = table.getChild('origin_lat');
const first = latitudes?.get(0);
```

When a single API compatibility page is needed, older examples referencing `Column` should map them to `Vector`.
