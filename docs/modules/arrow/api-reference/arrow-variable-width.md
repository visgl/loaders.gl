---
title: Arrow Variable-Width Conversion
description: Convert Arrow string and binary view vectors for runtime compatibility.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow variable-width utilities"
  title="Choose the string representation your runtime can use."
  description="These utilities convert Arrow `Utf8`, `Utf8View`, `Binary`, and `BinaryView` vectors and tables while preserving logical values, nulls, and unrelated columns."
  tone="cyan"
  meta={['Utf8 and Binary', 'View types', 'Compatibility conversion']}
  links={[
    {label: 'Arrow module', to: '/docs/modules/arrow'},
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'Table category', to: '/docs/specifications/category-table'}
  ]}
/>

<DocOrientation
  eyebrow="The variable-width boundary"
  title="Prefer views when available. Fall back when necessary."
  description="Arrow view types can reduce indirection for some runtimes, but applications may need standard variable-width vectors for compatibility. The conversion mode makes that choice explicit."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Utf8, Utf8View, Binary, or BinaryView'},
    {label: 'Mode', value: '`never`, `prefer`, or `require` view types'},
    {label: 'Preserve', value: 'Logical values, nulls, and data chunks'},
    {label: 'Output', value: 'A compatible Arrow vector or table'}
  ]}
/>

The `@loaders.gl/arrow` module can convert Apache Arrow `Utf8`, `Utf8View`, `Binary`, and
`BinaryView` vectors without changing their logical values.

<ReferenceBoundary
  title="Conversion modes and runtime details"
  description="The reference below covers vector and table conversion, view-type selection, runtime detection, and preservation guarantees."
  tone="cyan"
/>

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
