---
title: Column compatibility reference
description: Migrate older Arrow JS Column APIs to modern Vector and Table.getChild access.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · migration"
  title="Replace legacy Column access with Vector."
  description="Column is a historical Arrow JS name. Modern v21+ code reads a table column through Vector and Table.getChild(), preserving the same typed, chunk-aware data model."
  tone="yellow"
  meta={['Legacy name', 'Vector replacement', 'v21+ migration']}
  links={[
    {label: 'Vector', to: '/docs/arrowjs/api-reference/vector'},
    {label: 'Table', to: '/docs/arrowjs/api-reference/table'},
    {label: 'Arrow JS reference', to: '/docs/arrowjs/api-reference'}
  ]}
/>

<DocOrientation
  eyebrow="Migration at a glance"
  title="Change the accessor, keep the column meaning."
  description="The data remains a typed Arrow column. The modern API makes the table and vector boundary explicit instead of relying on a separate Column class name."
  tone="yellow"
  items={[
    {label: 'Old mental model', value: 'Column or getColumn()'},
    {label: 'Modern model', value: 'Vector returned by Table.getChild()'},
    {label: 'Indexed access', value: 'Use getChildAt(index) when position is known'},
    {label: 'Related guide', value: 'See the table and vector pages for full APIs'}
  ]}
/>

<ReferenceBoundary
  title="Column migration reference"
  description="The sections below show the modern accessor pattern and map historical Column examples to the current Vector API."
  tone="yellow"
/>

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
