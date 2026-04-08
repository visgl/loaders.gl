# UTF-8 Utilities

The UTF-8 utilities compare and parse Arrow UTF-8 value byte ranges without materializing them into
JavaScript strings.

Use these helpers with Arrow `Utf8` or `LargeUtf8` data when a hot path needs to inspect string
values directly from `data.values` and `data.valueOffsets`.

## Usage

```typescript
import * as arrow from 'apache-arrow';
import {compareUTF8, parseUTF8Number} from '@loaders.gl/arrow';

const column = table.getChild('score_text') as arrow.Vector<arrow.Utf8>;
const data = column.data[0];

const rowIndex = 0;
const firstByte = data.valueOffsets[rowIndex];
const endByte = data.valueOffsets[rowIndex + 1];

const score = parseUTF8Number(data.values, firstByte, endByte);
```

For sliced Arrow data, use the offsets from the sliced `arrow.Data` object you are reading. The
helpers expect byte offsets into the `Uint8Array` passed as `bytes`.

## `compareUTF8`

Compares two UTF-8 encoded byte ranges lexicographically using unsigned byte order.

```typescript
const order = compareUTF8(bytes1, firstByte1, endByte1, bytes2, firstByte2, endByte2);
```

### Parameters

- `bytes1`: first UTF-8 byte buffer.
- `firstByte1`: inclusive start byte offset in the first buffer.
- `endByte1`: exclusive end byte offset in the first buffer.
- `bytes2`: second UTF-8 byte buffer.
- `firstByte2`: inclusive start byte offset in the second buffer.
- `endByte2`: exclusive end byte offset in the second buffer.

### Returns

- `-1` when the first byte range sorts before the second byte range.
- `0` when the ranges contain identical bytes.
- `1` when the first byte range sorts after the second byte range.

## `parseUTF8Number`

Parses a UTF-8 encoded ASCII decimal number from a byte range.

```typescript
const value = parseUTF8Number(bytes, firstByte, endByte);
```

Supported syntax:

- Optional `+` or `-` sign.
- Decimal digits with an optional decimal point.
- Optional exponent using `e` or `E` with an optional exponent sign.
- Surrounding ASCII whitespace.

Returns `undefined` when the range is not a strict decimal number. It does not accept `Infinity`,
`NaN`, separators such as `1,000`, or non-ASCII digits.

## `parseUTF8BigInt`

Parses a UTF-8 encoded ASCII base-10 integer from a byte range.

```typescript
const value = parseUTF8BigInt(bytes, firstByte, endByte);
```

Supported syntax:

- Optional `+` or `-` sign.
- Decimal digits only.
- Surrounding ASCII whitespace.

Returns `undefined` when the range is not a strict base-10 integer. Decimal points and exponents are
not accepted.

## `parseUTF8Boolean`

Parses a UTF-8 encoded ASCII boolean from a byte range.

```typescript
const value = parseUTF8Boolean(bytes, firstByte, endByte);
```

Supported syntax:

- `true` or `false`, matched case-insensitively.
- Surrounding ASCII whitespace.

Returns `undefined` for all other values, including `0`, `1`, `yes`, and prefixes such as `trues`.

## Error Handling

All helpers throw `RangeError` when the byte range is invalid for the provided `Uint8Array`.

Parsing helpers return `undefined` for syntactically invalid values. They do not validate UTF-8
well-formedness because their accepted parse grammars are ASCII-only.
