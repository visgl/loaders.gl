Arrow UTF-8 utilities

![](/next/images/format-logos/apache-arrow-logo.png)

# UTF-8 utilities

These helpers compare UTF-8 values and parse numeric text directly from Arrow byte ranges. They are designed for hot paths where allocating JavaScript strings would add avoidable work.

[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)

The byte-range path

## Find the offsets. Read the bytes. Materialize only when needed.

Arrow stores variable-width strings in a values buffer plus offsets. These functions operate on that representation directly for comparisons and numeric parsing.

01

Input

Arrow Utf8 or LargeUtf8 data

02

Locate

Value offsets from the Arrow data chunk

03

Inspect

Unsigned UTF-8 comparison or number parsing

04

Result

A comparison value or parsed number

The UTF-8 utilities compare and parse Arrow UTF-8 value byte ranges without materializing them into JavaScript strings.

Use these helpers with Arrow `Utf8` or `LargeUtf8` data when a hot path needs to inspect string values directly from `data.values` and `data.valueOffsets`.

Detailed guide

## Byte offsets and utility details

The reference below covers UTF-8 comparison, numeric parsing, sliced data, offset handling, and supported Arrow string layouts.

## Usage[​](#usage "Direct link to Usage")

```
import * as arrow from 'apache-arrow';

import {compareUTF8, parseUTF8Number} from '@loaders.gl/tables/arrow';



const column = table.getChild('score_text') as arrow.Vector<arrow.Utf8>;

const data = column.data[0];



const rowIndex = 0;

const firstByte = data.valueOffsets[rowIndex];

const endByte = data.valueOffsets[rowIndex + 1];



const score = parseUTF8Number(data.values, firstByte, endByte);
```

For sliced Arrow data, use the offsets from the sliced `arrow.Data` object you are reading. The helpers expect byte offsets into the `Uint8Array` passed as `bytes`.

## `compareUTF8`[​](#compareutf8 "Direct link to compareutf8")

Compares two UTF-8 encoded byte ranges lexicographically using unsigned byte order.

```
const order = compareUTF8(bytes1, firstByte1, endByte1, bytes2, firstByte2, endByte2);
```

### Parameters[​](#parameters "Direct link to Parameters")

* `bytes1`: first UTF-8 byte buffer.
* `firstByte1`: inclusive start byte offset in the first buffer.
* `endByte1`: exclusive end byte offset in the first buffer.
* `bytes2`: second UTF-8 byte buffer.
* `firstByte2`: inclusive start byte offset in the second buffer.
* `endByte2`: exclusive end byte offset in the second buffer.

### Returns[​](#returns "Direct link to Returns")

* `-1` when the first byte range sorts before the second byte range.
* `0` when the ranges contain identical bytes.
* `1` when the first byte range sorts after the second byte range.

## `parseUTF8Number`[​](#parseutf8number "Direct link to parseutf8number")

Parses a UTF-8 encoded ASCII decimal number from a byte range.

```
const value = parseUTF8Number(bytes, firstByte, endByte);
```

Supported syntax:

* Optional `+` or `-` sign.
* Decimal digits with an optional decimal point.
* Optional exponent using `e` or `E` with an optional exponent sign.
* Surrounding ASCII whitespace.

Returns `undefined` when the range is not a strict decimal number. It does not accept `Infinity`, `NaN`, separators such as `1,000`, or non-ASCII digits.

## `parseUTF8BigInt`[​](#parseutf8bigint "Direct link to parseutf8bigint")

Parses a UTF-8 encoded ASCII base-10 integer from a byte range.

```
const value = parseUTF8BigInt(bytes, firstByte, endByte);
```

Supported syntax:

* Optional `+` or `-` sign.
* Decimal digits only.
* Surrounding ASCII whitespace.

Returns `undefined` when the range is not a strict base-10 integer. Decimal points and exponents are not accepted.

## `parseUTF8Boolean`[​](#parseutf8boolean "Direct link to parseutf8boolean")

Parses a UTF-8 encoded ASCII boolean from a byte range.

```
const value = parseUTF8Boolean(bytes, firstByte, endByte);
```

Supported syntax:

* `true` or `false`, matched case-insensitively.
* Surrounding ASCII whitespace.

Returns `undefined` for all other values, including `0`, `1`, `yes`, and prefixes such as `trues`.

## Error Handling[​](#error-handling "Direct link to Error Handling")

All helpers throw `RangeError` when the byte range is invalid for the provided `Uint8Array`.

Parsing helpers return `undefined` for syntactically invalid values. They do not validate UTF-8 well-formedness because their accepted parse grammars are ASCII-only.
