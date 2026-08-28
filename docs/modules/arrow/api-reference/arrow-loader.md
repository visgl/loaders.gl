---
title: ArrowLoader
description: Parse Arrow IPC files and streams into typed loaders.gl table shapes.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="Arrow module / loader"
  title="ArrowLoader"
  description="Read Arrow IPC data and keep its typed, columnar structure as it enters your application."
  tone="cyan"
  meta={['Input: .arrow / .feather', 'Output: ArrowTable', 'Supports batches']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'ArrowWriter', to: '/docs/modules/arrow/api-reference/arrow-writer'}
  ]}
/>

<ArrowDocsTabs active="arrowloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

The `ArrowLoader` parses the Apache Arrow columnar table format.

## Usage

```typescript
import {ArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, ArrowLoader, options);
```

## Shapes

`ArrowLoader` returns loaders.gl `ArrowTable` objects by default. Set `arrow.shape` to select another table representation.

| Shape              | Output                                                 |
| ------------------ | ------------------------------------------------------ |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Apache Arrow table |
| `columnar-table`   | loaders.gl columnar table                              |
| `array-row-table`  | loaders.gl row table with arrays                       |
| `object-row-table` | loaders.gl row table with objects                      |

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `arrow.shape` | `'arrow-table' \| 'columnar-table' \| 'array-row-table' \| 'object-row-table'` | `'arrow-table'` | Selects the returned loaders.gl table shape. |
| `arrow.batchDebounceMs` | `number` | `undefined` | Adds an async delay between emitted Arrow batches. |
