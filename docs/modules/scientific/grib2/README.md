# GRIB2

The `@loaders.gl/scientific/grib2` subpath exports a parser and scientific-array source for a
bounded GRIB edition 2 subset.

```ts
import {parseGRIB2} from '@loaders.gl/scientific/grib2';

const messages = parseGRIB2(bytes);
```

`parseGRIB2` accepts an `ArrayBuffer` or `Uint8Array` and returns `GRIB2Message[]`.
`GRIB2Source` exposes parsed messages through the common scientific-array source contract.
These are direct APIs, not metadata loader descriptors exported from the package root.

The current parser supports grid template 3.0, product template 4.0, and simple packing
template 5.0 with bit widths up to 32. It accepts explicit bitmaps or no bitmap and rejects
unsupported templates and malformed section layouts. General GRIB2 support, including other
packing methods and grid definitions, should not be inferred from this subset.
