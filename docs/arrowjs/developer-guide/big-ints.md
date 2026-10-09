---
title: Working with Arrow big integers
description: Preserve 64-bit and 128-bit numeric values across Arrow buffers and JavaScript conversions.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · numeric precision"
  title="Keep wide numbers wide until you choose to convert them."
  description="Arrow’s Int64, Uint64, and Decimal values can exceed JavaScript’s safe integer range. Arrow JS keeps their underlying representation precise and provides explicit conversion paths for numbers, strings, BigInts, and JSON."
  tone="orange"
  meta={['Int64 and Uint64', 'Decimal128', 'BigInt-aware']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'Data types', to: '/docs/arrowjs/developer-guide/data-types'},
    {label: 'Vector API', to: '/docs/arrowjs/api-reference/vector'}
  ]}
/>

<DocOrientation
  eyebrow="The precision boundary"
  title="Choose a representation that matches the consumer."
  description="Use native BigInt when the runtime supports it, strings when values cross JSON boundaries, or numbers only when the application has established that precision loss is acceptable."
  tone="orange"
  items={[
    {label: 'Storage', value: '64-bit typed arrays for Int64 and Uint64'},
    {label: 'BigInt', value: 'Native Int64 and Uint64 values'},
    {label: 'String', value: 'Stable decimal representation for JSON and logs'},
    {label: 'Number', value: 'Convenient but limited to safe integer precision'}
  ]}
/>

<ReferenceBoundary
  title="Wide integer details"
  description="The examples below explain the integer vectors, native BigInt values, JSON conversion, and precision caveats."
  tone="orange"
/>

# Working with BigInts

Arrow JS v21 exposes `Int64` and `Uint64` vector values as native JavaScript
`bigint` values. Build these vectors from `BigInt64Array` / `BigUint64Array`, or
use `vectorFromArray` with an explicit integer type.

```typescript
import {makeVector, vectorFromArray, Int64} from 'apache-arrow';

const value = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
const vector = makeVector(new BigInt64Array([value]));
const sameValues = vectorFromArray([value], new Int64());

console.log(vector.get(0) === sameValues.get(0)); // true
console.log(vector.get(0)?.toString()); // '9007199254740992'
```

Keep values as `bigint` for exact integer arithmetic. Converting to `number`
can lose precision outside JavaScript's safe integer range. `JSON.stringify`
does not serialize a `bigint` directly; convert it to a decimal string when
preparing JSON output.

`Decimal` is a separate 128-bit fixed-point type with a declared scale. Its
values use typed-array storage; do not apply the native `Int64` example to
decimal values or discard their scale.
