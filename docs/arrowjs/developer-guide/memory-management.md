---
title: Arrow JavaScript memory management
description: Understand how Arrow JS keeps columns over shared buffers and when an operation creates a copy.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · memory"
  title="Keep columns as views over the buffers you already have."
  description="Arrow’s memory model is built around contiguous buffers, chunked record batches, and logical vectors that can share those buffers. That makes slicing and transfer inexpensive when the operation does not require flattening."
  tone="mint"
  meta={['ArrayBuffer views', 'Chunked vectors', 'Copy boundaries']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'Data API', to: '/docs/arrowjs/api-reference/data'},
    {label: 'Binary data', to: '/docs/developer-guide/concepts/binary-data'}
  ]}
/>

<DocOrientation
  eyebrow="The memory model"
  title="Share storage first; materialize only at a boundary."
  description="Record batches own chunks of column data. Tables and vectors compose views over those chunks, so many reads can avoid copying until the application explicitly asks for a flattened or converted representation."
  tone="mint"
  items={[
    {label: 'Buffers', value: 'Incoming ArrayBuffers hold contiguous bytes'},
    {label: 'Chunks', value: 'Each record batch contributes column slices'},
    {label: 'Views', value: 'Vectors and tables compose logical columns'},
    {label: 'Copies', value: 'Flattening and conversion create new storage'}
  ]}
/>

<ReferenceBoundary
  title="Memory management details"
  description="The notes below explain buffer ownership, chunked columns, slicing, immutability, and the operations that cross the no-copy boundary."
  tone="mint"
/>

# Notes on Memory Management

Apache Arrow is a performance-optimized architecture, and the foundation of that performance is the approach to memory management. It can be useful to have an understanding of how.

## How Arrow Stores Data

Arrow reads in arrow data as arraybuffer(s) and then creates chunks that are "sub array views" into that big array buffer, and lists of those chunks are then composed into "logical" arrays.

Chunks are created for each column in each RecordBatch.

The chunks can be "sliced and diced" by operations on `Column`, `Table` and `DataFrame` objects, but are never copied (as long as flattening is not requested) and are conceptually immutable. (There is a low-level `Vector.set()` method however given that it could modify data that is used by multiple objects its use should be reserved for cases where implications are fully understood).
