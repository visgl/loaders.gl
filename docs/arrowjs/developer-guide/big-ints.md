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
    {label: 'Storage', value: 'Arrow keeps wide values in paired 32-bit buffers'},
    {label: 'BigInt', value: 'Native signed or unsigned integer conversion'},
    {label: 'String', value: 'Stable decimal representation for JSON and logs'},
    {label: 'Number', value: 'Convenient but limited to safe integer precision'}
  ]}
/>

<ReferenceBoundary
  title="Wide integer details"
  description="The examples below explain the typed-array representation, conversion helpers, native BigInt support, and precision caveats."
  tone="orange"
/>

# Working with BigInts

Arrow supports big integers.

If the JavaScript platform supports the recently introduced `BigInt64Array` typed array, Arrow JS will use this type.

For convenience ArrowJS inject additional methods (on the object instance) that lets it be converted to JSON, strings, values and primitives

- `bigIntArray.toJSON()`
- `bigIntArray.toString()`
- `bigIntArray.valueOf()`
- `bigIntArray[Symbol.toPrimitive](hint: 'string' | 'number' | 'default')`

## Notes about Conversion Methods

When you have one of the wide numeric types (`Int64`, `Uint64`, or `Decimal` which is 128bit), those `Vector` instances always return/accept subarray slices of the underlying 32bit typed arrays.

But to make life easier for people consuming the typed arrays, the Arrow JS API adds some [extra methods](https://github.com/apache/arrow/blob/3eb07b7ed173e2ecf41d689b0780dd103df63a00/js/src/util/bn.ts#L31) to the typed arrays before they're returned. The goal of these methods is to handle conversion to and from the various primitive types (`number`, `string`, `bigint`, and `JSON.stringify()`) so people usually "fall into the pit of success".

One of the added methods is an implementation of [`[Symbol.toPrimitive]`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive), which JS will use when doing certain kinds of implicit primitive coercion.

The implementation of these methods is [bifurcated](https://github.com/apache/arrow/blob/3eb07b7ed173e2ecf41d689b0780dd103df63a00/js/src/util/bn.ts#L125), so if you're in an environment with `BigInt` support we use the native type, but if not, we'll make a best-effort attempt to return something meaningful (usually the unsigned decimal representation of the number as a string, though we'd appreciate help if someone knows how to compute the signed decimal representation).

Examples:

````typescript
import {Int64Vector} from 'apache-arrow';
import assert from 'assert';

const bigIntArr = new BigInt64Array([1n + BigInt(Number.MAX_SAFE_INTEGER)]);
const lilIntArr = new Int32Array(bigIntArr.buffer);
assert(bigIntArr.length === 1);
assert(lilIntArr.length === 2);

const bigIntVec = Int64Vector.from(bigIntArr);
assert(bigIntVec.length === 1);

const bigIntVal = bigIntVec.get(0);
assert(bigIntVal instanceof Int32Array);
assert(bigIntVal[0] === 0);
assert(bigIntVal[1] === 2097152);

// these implicitly call bigIntVal[Symbol.toPrimitive]()
assert('' + bigIntVal == '9007199254740992'); // aka bigIntVal[Symbol.toPrimitive]('string')
assert(0 + bigIntVal == 9007199254740992); // aka bigIntVal[Symbol.toPrimitive]('number')
assert(0n + bigIntVal == 9007199254740992n); // aka bigIntVal[Symbol.toPrimitive]('default')```
````
