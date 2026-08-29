---
title: Chunked Arrow vectors
description: Work with Arrow vectors composed from multiple data chunks without treating chunking as a separate public type.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · API reference"
  title="Let one vector span several record-batch buffers."
  description="Apache Arrow JS v21 represents chunked data through the public Vector model. Construct a vector from multiple Data segments and keep slicing, concatenation, iteration, and row access on the same API."
  tone="mint"
  meta={['Vector<T>', 'Multiple Data chunks', 'Arrow JS v21']}
  links={[
    {label: 'Vector API', to: '/docs/arrowjs/api-reference/vector'},
    {label: 'Data API', to: '/docs/arrowjs/api-reference/data'},
    {label: 'Memory management', to: '/docs/arrowjs/developer-guide/memory-management'}
  ]}
/>

<DocOrientation
  eyebrow="The chunk boundary"
  title="Keep batches separate without changing the column contract."
  description="A Vector can reference several immutable Data segments. Consumers see one logical column while Arrow retains the chunk boundaries useful for incremental I/O and low-copy composition."
  tone="mint"
  items={[
    {label: 'Construct', value: 'Pass multiple Data segments to Vector'},
    {label: 'Read', value: 'Use one logical length and standard vector access'},
    {label: 'Compose', value: 'Slice, concatenate, and iterate across chunks'},
    {label: 'Version', value: 'Aligned with the Apache Arrow JS v21 model'}
  ]}
/>

<ReferenceBoundary
  title="Chunked vector details"
  description="The examples below document the v21 public model, construction from Data buffers, and operations that cross chunk boundaries."
  tone="mint"
/>

# Chunked

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

`Chunked` is not a separate public class in Apache Arrow JS v21.
The public model is that a `Vector<T>` can represent multiple chunks when constructed from multiple `Data<T>` buffers.

## Usage

```ts
import {makeData, Vector, Int32} from 'apache-arrow';

const chunkA = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});
const chunkB = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([3, 4])});
const vector = new Vector([chunkA, chunkB]);
console.log(vector.length);
```

## v21 behavior

- Constructing a vector from multiple data segments yields a chunked vector instance.
- `slice`, `concat`, and iteration work across chunk boundaries.
- Child vectors and row access continue to use [`Vector`](/docs/arrowjs/api-reference/vector) semantics.

```ts
import {makeData, Data, Vector, Int32} from 'apache-arrow';

const chunkA = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});
const chunkB = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([3, 4])});
const vector = new Vector<Data>([chunkA, chunkB]);
console.log(vector.length); // 4
```
