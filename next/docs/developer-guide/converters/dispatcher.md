Shape conversion

# Change representation without hard-coding every route.

The shared converter dispatcher detects an input shape, selects a valid path through the converters you provide, and applies each direct transformation in order.

[Table converters](https://loaders.gl/next/docs/developer-guide/converters/table-and-arrow-converters.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/table-and-arrow-converters.md)[Format categories](https://loaders.gl/next/docs/developer-guide/converters/format-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/format-categories.md)

A converter is one edge

## Register the steps. Let the dispatcher find the route.

Each converter declares the shapes it accepts and produces. The dispatcher keeps format-specific knowledge in those edges, so applications can add or remove routes without rewriting the central algorithm.

01

Detect

Identify the source representation

02

Plan

Find a valid path to the target shape

03

Convert

Execute direct steps with context

04

Explain

Use stable converter IDs in errors and logs

The shared dispatcher lives in `@loaders.gl/core/schema-utils`:

Detailed guide

## Dispatcher contract and path selection

The sections below cover converter fields, path selection, direct conversion steps, and the boundaries of the shared dispatcher.

```
convert(input, targetShape, converters, options?)
```

## What `convert()` Does[​](#what-convert-does "Direct link to what-convert-does")

`convert()`:

1. detects the source shape from `input`
2. finds the shortest valid path through the converters you passed
3. executes each direct step in order

It does not include format-specific conversion logic itself. All direct edges come from the converter objects you provide.

## Converter Contract[​](#converter-contract "Direct link to Converter Contract")

Each converter object may define:

| Field                                           | Purpose                               |
| ----------------------------------------------- | ------------------------------------- |
| `id`                                            | Stable identifier for logs and errors |
| `from`                                          | Source shapes it accepts              |
| `to`                                            | Target shapes it can produce          |
| `detectInputShape(input)`                       | Optional runtime shape detection      |
| `canConvert(sourceShape, targetShape)`          | Optional filter for direct edges      |
| `convert(input, targetShape, options, context)` | One direct conversion step            |

## Path Selection[​](#path-selection "Direct link to Path Selection")

`convert()` works with direct edges, not hardcoded pipelines.

If you pass:

```
import {convert, TableConverter} from '@loaders.gl/core/schema-utils';

import {ArrowConverter} from '@loaders.gl/tables/arrow';



const objectRows = convert(arrowTable, 'object-row-table', [ArrowConverter, TableConverter]);
```

the dispatcher can choose:

`'arrow' -> 'arrow-table' -> 'object-row-table'`

If you leave out one of those converters, there is no path and the call fails.

## Bundles[​](#bundles "Direct link to Bundles")

Some packages export convenience arrays:

* `TABLE_CONVERTERS`
* `ARROW_CONVERTERS`
* `GEOARROW_CONVERTERS`
* `GEOARROW_GEOMETRY_CONVERTERS`

These are plain arrays. They are useful when you want a package’s whole converter surface, but direct imports are still the smaller option.

## Tree-Shaking[​](#tree-shaking "Direct link to Tree-Shaking")

Because the dispatcher only sees the converters you pass, unused converter families stay out of your bundle.

In practice:

* import only the leaf converters you need
* prefer direct converter arrays over large convenience bundles when size matters
* use render utilities directly when you are preparing deck.gl or other binary rendering data
