Arrow JavaScript · numeric precision

# Keep wide numbers wide until you choose to convert them.

Arrow’s Int64, Uint64, and Decimal values can exceed JavaScript’s safe integer range. Arrow JS keeps their underlying representation precise and provides explicit conversion paths for numbers, strings, BigInts, and JSON.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Data types](https://loaders.gl/next/docs/arrowjs/developer-guide/data-types.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/data-types.md)[Vector API](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

The precision boundary

## Choose a representation that matches the consumer.

Use native BigInt when the runtime supports it, strings when values cross JSON boundaries, or numbers only when the application has established that precision loss is acceptable.

01

Storage

64-bit typed arrays for Int64 and Uint64

02

BigInt

Native Int64 and Uint64 values

03

String

Stable decimal representation for JSON and logs

04

Number

Convenient but limited to safe integer precision

Detailed guide

## Wide integer details

The examples below explain the integer vectors, native BigInt values, JSON conversion, and precision caveats.

# Working with BigInts

Arrow JS v21 exposes `Int64` and `Uint64` vector values as native JavaScript `bigint` values. Build these vectors from `BigInt64Array` / `BigUint64Array`, or use `vectorFromArray` with an explicit integer type.

```
import {makeVector, vectorFromArray, Int64} from 'apache-arrow';



const value = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

const vector = makeVector(new BigInt64Array([value]));

const sameValues = vectorFromArray([value], new Int64());



console.log(vector.get(0) === sameValues.get(0)); // true

console.log(vector.get(0)?.toString()); // '9007199254740992'
```

Keep values as `bigint` for exact integer arithmetic. Converting to `number` can lose precision outside JavaScript's safe integer range. `JSON.stringify` does not serialize a `bigint` directly; convert it to a decimal string when preparing JSON output.

`Decimal` is a separate 128-bit fixed-point type with a declared scale. Its values use typed-array storage; do not apply the native `Int64` example to decimal values or discard their scale.
