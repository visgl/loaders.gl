Arrow variable-width utilities

![](/next/images/format-logos/apache-arrow-logo.png)

# Arrow variable-width conversion

These utilities convert Arrow `Utf8`, `Utf8View`, `Binary`, and `BinaryView` vectors and tables while preserving logical values, nulls, and unrelated columns.

[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)

The variable-width boundary

## Prefer views when available. Fall back when necessary.

Arrow view types can reduce indirection for some runtimes, but applications may need standard variable-width vectors for compatibility. The conversion mode makes that choice explicit.

01

Input

Utf8, Utf8View, Binary, or BinaryView

02

Mode

\`never\`, \`prefer\`, or \`require\` view types

03

Preserve

Logical values, nulls, and data chunks

04

Output

A compatible Arrow vector or table

The `@loaders.gl/tables/arrow` module can convert Apache Arrow `Utf8`, `Utf8View`, `Binary`, and `BinaryView` vectors without changing their logical values.

Detailed guide

## Conversion modes and runtime details

The reference below covers vector and table conversion, view-type selection, runtime detection, and preservation guarantees.

```
import {

  convertArrowTableVariableWidthTypes,

  convertArrowVariableWidthVector

} from '@loaders.gl/tables/arrow';



const viewVector = convertArrowVariableWidthVector(utf8Vector, {viewTypes: 'prefer'});

const standardVector = convertArrowVariableWidthVector(viewVector, {viewTypes: 'never'});



const viewTable = convertArrowTableVariableWidthTypes(table, {viewTypes: 'prefer'});
```

## Runtime compatibility[​](#runtime-compatibility "Direct link to Runtime compatibility")

The utilities discover `Utf8View` and `BinaryView` support from the installed `apache-arrow` runtime. They do not require applications that use Arrow 17 through 21.1 to upgrade.

* `viewTypes: 'never'` (the default) converts view columns to standard `Utf8` or `Binary` columns.
* `viewTypes: 'prefer'` uses view columns when supported and falls back to standard columns.
* `viewTypes: 'require'` uses view columns and throws when the runtime does not support them.

Vector conversion preserves null values and Arrow data chunk boundaries. Table conversion applies to top-level variable-width columns and preserves other columns without copying them.
