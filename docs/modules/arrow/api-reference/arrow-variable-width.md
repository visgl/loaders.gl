# Arrow Variable-Width Conversion

The `@loaders.gl/arrow` module can convert Apache Arrow `Utf8`, `Utf8View`, `Binary`, and
`BinaryView` vectors without changing their logical values.

```ts
import {
  convertArrowTableVariableWidthTypes,
  convertArrowVariableWidthVector
} from '@loaders.gl/arrow';

const viewVector = convertArrowVariableWidthVector(utf8Vector, {viewTypes: 'prefer'});
const standardVector = convertArrowVariableWidthVector(viewVector, {viewTypes: 'never'});

const viewTable = convertArrowTableVariableWidthTypes(table, {viewTypes: 'prefer'});
```

## Runtime compatibility

The utilities discover `Utf8View` and `BinaryView` support from the installed `apache-arrow`
runtime. They do not require applications that use Arrow 17 through 21.1 to upgrade.

- `viewTypes: 'never'` (the default) converts view columns to standard `Utf8` or `Binary` columns.
- `viewTypes: 'prefer'` uses view columns when supported and falls back to standard columns.
- `viewTypes: 'require'` uses view columns and throws when the runtime does not support them.

Vector conversion preserves null values and Arrow data chunk boundaries. Table conversion applies
to top-level variable-width columns and preserves other columns without copying them.
