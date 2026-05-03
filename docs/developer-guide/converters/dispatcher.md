# Converter Dispatcher

The shared dispatcher lives in `@loaders.gl/schema-utils`:

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
