---
title: ArrowLoader
description: Parse Arrow IPC files and streams into typed loaders.gl table shapes.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {ArrowJsStructureGraphic} from '@site/src/components/docs/arrow-js-structure-graphic';
import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero capability="arrow" />

<DocPageHeader
  eyebrow="Arrow module / loader"
  title="ArrowLoader"
  description="Read Arrow IPC data and keep its typed, columnar structure as it enters your application."
  hideTitle
  tone="cyan"
  meta={['Input: .arrow / .feather', 'Output: ArrowTable', 'Supports batches']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'ArrowWriter', to: '/docs/modules/arrow/api-reference/arrow-writer'}
  ]}
/>

<ArrowDocsTabs active="arrowloader" />

<ArrowJsStructureGraphic />

<DocOrientation
  eyebrow="What ArrowLoader preserves"
  title="Bring the columns in without turning them into rows."
  description="ArrowLoader keeps IPC data in its typed table form by default, while allowing applications to choose a different loaders.gl table shape when an integration needs it."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Arrow IPC files, streams, and compatible responses'},
    {label: 'Default', value: "ArrowTable output with shape: 'arrow-table'"},
    {label: 'Alternatives', value: 'Columnar, array-row, or object-row table wrappers'},
    {label: 'Streaming', value: 'Incremental Arrow batches with optional debounce'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

The `ArrowLoader` parses the Apache Arrow columnar table format.

<ReferenceBoundary
  title="ArrowLoader usage and options"
  description="The reference below covers loading, returned shapes, batch behavior, and the options that control table conversion."
  tone="cyan"
/>

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
