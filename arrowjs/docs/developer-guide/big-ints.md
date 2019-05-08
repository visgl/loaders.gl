# Working with BigInts

Arrow supports big integers.

If the JavaScript platform supports the recently introduced `BigInt64Array` typed array, Arrow JS will use this type.

For convenience ArrowJS inject additional methods (on the object instance) that lets it be converted to JSON, strings, values and primitives

* `bigIntArray.toJSON()`
* `bigIntArray.toString()`
* `bigIntArray.valueOf()`
* `bigIntArray[Symbol.toPrimitive](hint: 'string' | 'number' | 'default')`
