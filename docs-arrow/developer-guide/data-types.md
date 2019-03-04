# Data Types

Arrow supports a rich set of data types:

* Fixed-length primitive types: numbers, booleans, date and times, fixed size binary, decimals, and other values that fit into a given number
* Variable-length primitive types: binary, string
* Nested types: list, struct, and union
* Dictionary type: An encoded categorical type


### Converting Dates

Apache Arrow Timestamp is a 64-bit int of milliseconds since the epoch, represented as two 32-bit ints in JS to preserve precision. The fist number is the "low" int and the second number is the "high" int.

```js
function toDate(timestamp) {
  return new Date((timestamp[1] * Math.pow(2, 32) + timestamp[0])/1000);
}
```

