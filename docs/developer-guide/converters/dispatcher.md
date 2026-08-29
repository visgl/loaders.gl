---
title: Converter dispatcher
description: Route compatible table and geometry values through the shortest registered conversion path.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Shape conversion"
  title="Change representation without hard-coding every route."
  description="The shared converter dispatcher detects an input shape, selects a valid path through the converters you provide, and applies each direct transformation in order."
  tone="orange"
  meta={['Shape detection', 'Graph routing', 'Composable converters']}
  links={[
    {label: 'Table converters', to: '/docs/developer-guide/converters/table-and-arrow-converters'},
    {label: 'Format categories', to: '/docs/developer-guide/converters/format-categories'}
  ]}
/>

<DocOrientation
  eyebrow="A converter is one edge"
  title="Register the steps. Let the dispatcher find the route."
  description="Each converter declares the shapes it accepts and produces. The dispatcher keeps format-specific knowledge in those edges, so applications can add or remove routes without rewriting the central algorithm."
  tone="orange"
  items={[
    {label: 'Detect', value: 'Identify the source representation'},
    {label: 'Plan', value: 'Find a valid path to the target shape'},
    {label: 'Convert', value: 'Execute direct steps with context'},
    {label: 'Explain', value: 'Use stable converter IDs in errors and logs'}
  ]}
/>

The shared dispatcher lives in `@loaders.gl/schema-utils`:

<ReferenceBoundary
  title="Dispatcher contract and path selection"
  description="The sections below cover converter fields, path selection, direct conversion steps, and the boundaries of the shared dispatcher."
  tone="orange"
/>

```ts
convert(input, targetShape, converters, options?)
```

## What `convert()` Does

`convert()`:

1. detects the source shape from `input`
2. finds the shortest valid path through the converters you passed
3. executes each direct step in order

It does not include format-specific conversion logic itself. All direct edges come from the converter objects you provide.

## Converter Contract

Each converter object may define:

| Field | Purpose |
| --- | --- |
| `id` | Stable identifier for logs and errors |
| `from` | Source shapes it accepts |
| `to` | Target shapes it can produce |
| `detectInputShape(input)` | Optional runtime shape detection |
| `canConvert(sourceShape, targetShape)` | Optional filter for direct edges |
| `convert(input, targetShape, options, context)` | One direct conversion step |

## Path Selection

`convert()` works with direct edges, not hardcoded pipelines.

If you pass:

```ts
import {convert, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';

const objectRows = convert(arrowTable, 'object-row-table', [ArrowConverter, TableConverter]);
```

the dispatcher can choose:

`'arrow' -> 'arrow-table' -> 'object-row-table'`

If you leave out one of those converters, there is no path and the call fails.

## Bundles

Some packages export convenience arrays:

- `TABLE_CONVERTERS`
- `ARROW_CONVERTERS`
- `GEOARROW_CONVERTERS`
- `GEOARROW_GEOMETRY_CONVERTERS`
- `GIS_CONVERTERS`

These are plain arrays. They are useful when you want a package’s whole converter surface, but direct imports are still the smaller option.

## Tree-Shaking

Because the dispatcher only sees the converters you pass, unused converter families stay out of your bundle.

In practice:

- import only the leaf converters you need
- prefer direct converter arrays over large convenience bundles when size matters
- use render utilities directly when you are preparing deck.gl or other binary rendering data
