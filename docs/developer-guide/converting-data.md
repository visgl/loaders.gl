# Converting Data

The loaders.gl conversion system is built around small, explicit converter modules and a shared dispatcher:

```ts
import {convert} from '@loaders.gl/schema-utils';
import {TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';

const arrowTable = convert(table, 'arrow', [TableConverter, ArrowConverter]);
```

This design keeps conversion logic in leaf modules, avoids global registration, and lets applications choose exactly which converters to include.

![Converter flow](/img/developer-guide/conversion-flow.svg)

## Core API

The generic dispatcher lives in `@loaders.gl/schema-utils`:

```ts
convert(input, targetShape, converters, options?)
```

`convert()`:

- detects the source shape from the input value
- finds the shortest supported path through the supplied converters
- executes each direct conversion step in order

The dispatcher does not bundle any format-specific conversion logic by itself.

## Converter Objects

Each leaf converter publishes:

- `id` - stable identifier used in debugging and error messages
- `from` - source shapes the converter accepts
- `to` - target shapes the converter can produce
- `detectInputShape(input)` - optional runtime shape detection for raw inputs
- `canConvert(sourceShape, targetShape)` - optional pair filter
- `convert(input, targetShape, options, context)` - direct conversion step

Current leaf converters include:

- `TableConverter`
- `ArrowConverter`
- `GeoArrowTableConverter`
- `FeatureCollectionConverter`
- `GeometryConverter`

## Leaf Converters

### TableConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/schema-utils` |
| `id` | `'table'` |
| `from` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| `to` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| Detection | Reads `input.shape` on loaders.gl table wrappers |
| Direct paths | Any table wrapper shape -> any other table wrapper shape |
| Typical use | Normalize loaders.gl table wrappers before composing with other converters |

| Method | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable converter identifier used in debugging and errors. |
| `from` | ``readonly ('object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table')[]`` | Source table wrapper shapes the converter accepts. |
| `to` | ``readonly ('object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table')[]`` | Target table wrapper shapes the converter can produce. |
| `detectInputShape` | ``(input: unknown) => 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table' \| null`` | Detects loaders.gl table wrapper shapes from `input.shape`. |
| `canConvert` | `(sourceShape, targetShape) => boolean` | Rejects no-op conversions where source and target are the same shape. |
| `convert` | `(input, targetShape) => Table` | Converts one loaders.gl table wrapper shape into another. |

### ArrowConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/arrow` |
| `id` | `'arrow'` |
| `from` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| `to` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| Detection | Treats raw Apache Arrow `Table` instances without a loaders.gl `shape` field as `'arrow'` |
| Direct paths | `'arrow'` ↔ loaders.gl table shapes |
| Typical use | Bridge between Apache Arrow tables and loaders.gl table wrappers |

| Method | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable converter identifier used in debugging and errors. |
| `from` | ``readonly ('arrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table' \| 'geojson-table')[]`` | Source Arrow and table-wrapper shapes the converter accepts. |
| `to` | ``readonly ('arrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table' \| 'geojson-table')[]`` | Target Arrow and table-wrapper shapes the converter can produce. |
| `detectInputShape` | ``(input: unknown) => 'arrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table' \| 'geojson-table' \| null`` | Detects raw Apache Arrow tables. |
| `canConvert` | `(sourceShape, targetShape) => boolean` | Allows only Arrow-to-wrapper or wrapper-to-Arrow direct paths. |
| `convert` | `(input, targetShape, options?) => Table \| arrow.Table` | Converts one direct Arrow step. |

### GeoArrowTableConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/geoarrow` |
| `id` | `'geoarrow-table'` |
| `from` | `'geoarrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'`, `'arrow-table'` |
| `to` | `'geoarrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'`, `'arrow-table'` |
| Detection | Detects Arrow tables whose schema contains GeoArrow geometry metadata |
| Direct paths | `'geoarrow'` ↔ loaders.gl table shapes |
| Typical use | Move between GeoArrow Arrow tables and loaders.gl table wrappers |

| Method | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable converter identifier used in debugging and errors. |
| `from` | ``readonly ('geoarrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'geojson-table' \| 'arrow-table')[]`` | Source GeoArrow and table-wrapper shapes the converter accepts. |
| `to` | ``readonly ('geoarrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'geojson-table' \| 'arrow-table')[]`` | Target GeoArrow and table-wrapper shapes the converter can produce. |
| `detectInputShape` | ``(input: unknown) => 'geoarrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'geojson-table' \| 'arrow-table' \| null`` | Detects Arrow tables with GeoArrow metadata. |
| `canConvert` | `(sourceShape, targetShape) => boolean` | Allows only GeoArrow-to-wrapper or wrapper-to-GeoArrow direct paths. |
| `convert` | `(input, targetShape, options?) => Table \| arrow.Table` | Converts one direct GeoArrow table step. |

### FeatureCollectionConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/gis` |
| `id` | `'feature-collection'` |
| `from` | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'` |
| `to` | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'` |
| Detection | Detects arrays as GeoJSON or Flat GeoJSON and objects with `shape` as binary feature collections |
| Direct paths | `'geojson'` -> `'flat-geojson'` / `'binary-feature-collection'`, `'flat-geojson'` -> `'binary-feature-collection'`, `'binary-feature-collection'` -> `'geojson'` |
| Typical use | Normalize GIS feature collections across object, flat, and binary forms |

| Method | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable converter identifier used in debugging and errors. |
| `from` | ``readonly ('geojson' \| 'flat-geojson' \| 'binary-feature-collection')[]`` | Source feature collection shapes the converter accepts. |
| `to` | ``readonly ('geojson' \| 'flat-geojson' \| 'binary-feature-collection')[]`` | Target feature collection shapes the converter can produce. |
| `detectInputShape` | ``(input: unknown) => 'geojson' \| 'flat-geojson' \| 'binary-feature-collection' \| null`` | Detects GeoJSON arrays, Flat GeoJSON arrays, and binary feature collections. |
| `canConvert` | `(sourceShape, targetShape) => boolean` | Restricts the direct edges to the implemented feature collection conversions. |
| `convert` | `(input, targetShape, options?) => unknown` | Converts one direct feature collection step. |

### GeometryConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/gis` |
| `id` | `'geometry'` |
| `from` | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'` |
| `to` | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'` |
| Detection | Detects strings as WKT, binary buffers as WKB/TWKB, and geometry-like objects as GeoJSON geometry |
| Direct paths | `'geojson-geometry'` -> `'wkb'` / `'wkt'` / `'twkb'`, `'wkb'` / `'wkt'` / `'twkb'` -> `'geojson-geometry'` |
| Typical use | Convert single geometry values between GeoJSON and compact wire formats |

| Method | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable converter identifier used in debugging and errors. |
| `from` | ``readonly ('geojson-geometry' \| 'wkb' \| 'wkt' \| 'twkb')[]`` | Source geometry shapes the converter accepts. |
| `to` | ``readonly ('geojson-geometry' \| 'wkb' \| 'wkt' \| 'twkb')[]`` | Target geometry shapes the converter can produce. |
| `detectInputShape` | ``(input: unknown) => 'geojson-geometry' \| 'wkb' \| 'wkt' \| 'twkb' \| null`` | Detects WKT strings, WKB/TWKB buffers, and GeoJSON geometry objects. |
| `canConvert` | `(sourceShape, targetShape) => boolean` | Restricts direct edges to implemented single-geometry conversions. |
| `convert` | `(input, targetShape) => unknown` | Converts one direct single-geometry step. |

## Composition

Converters are explicit. If a conversion needs more than one step, pass the set of converters that should participate:

```ts
import {convert, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';

const objectRows = convert(arrowTable, 'object-row-table', [ArrowConverter, TableConverter]);
```

The dispatcher will:

1. detect the source shape
2. choose the shortest valid path to the requested target shape
3. run each converter step with the same `options` object

If no path exists, or if the source shape is ambiguous, `convert()` throws an error.

## Bundles

Packages may also export opt-in converter arrays for convenience:

- `TABLE_CONVERTERS`
- `ARROW_CONVERTERS`
- `GEOARROW_CONVERTERS`
- `GIS_CONVERTERS`

These are plain arrays. There is no global registration or side-effect based discovery.

## Tree-Shaking

Because applications pass converter modules explicitly, bundlers can tree-shake unused converters. This avoids pulling an entire conversion graph into an application just to support one or two shapes.

In practice:

- import the smallest leaf converters that solve your problem
- pass only those converters to `convert()`
- use convenience bundles only when the extra surface is acceptable
