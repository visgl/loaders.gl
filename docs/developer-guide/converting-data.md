# Converting Data

The loaders.gl converter system is a graph of small, explicit converter objects. You pass the converters you want, `convert()` finds a path, and each leaf module handles one direct step.

```ts
import {convert, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';
import {
  FeatureCollectionConverter,
  GeometryConverter
} from '@loaders.gl/gis';

const arrowTable = convert(table, 'arrow', [TableConverter, ArrowConverter]);
const wkb = convert(geometry, 'wkb', [GeometryConverter]);
const binary = convert(features, 'binary-feature-collection', [FeatureCollectionConverter]);
```

![Converter flow](/img/developer-guide/conversion-flow.svg)

## In This Section

| Topic | Use it for |
| --- | --- |
| [Converter dispatcher](/docs/developer-guide/converters/dispatcher) | How `convert()` detects shapes and chooses a path |
| [Table and Arrow converters](/docs/developer-guide/converters/table-and-arrow-converters) | Moving between loaders.gl table wrappers and Apache Arrow |
| [GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters) | Converting GeoArrow tables and rewriting GeoArrow geometry encodings |
| [Feature collection converters](/docs/developer-guide/converters/feature-collection-converters) | GeoJSON, Flat GeoJSON, binary feature collections, and geometry wire formats |
| [Render converters](/docs/developer-guide/converters/render-converters) | Direct geometry-column to `BinaryFeatureCollection` and Arrow-backed binary wrappers |
| [Format categories](/docs/developer-guide/converters/format-categories) | The shapes and format families these converters connect |

## Core Ideas

- Converters are opt-in. There is no global registry.
- Each leaf converter handles direct edges only.
- `convert()` can compose multiple direct steps when you pass enough converters.
- Geometry rendering does not have to route through GeoJSON.

## Current Converter Families

| Converter | Package | Direct responsibility |
| --- | --- | --- |
| `TableConverter` | `@loaders.gl/schema-utils` | loaders.gl table wrappers |
| `ArrowConverter` | `@loaders.gl/arrow` | Apache Arrow tables and table wrappers |
| `GeoArrowTableConverter` | `@loaders.gl/geoarrow` | GeoArrow tables and wrapper/table shapes |
| `GeoArrowGeometryConverter` | `@loaders.gl/geoarrow` | GeoArrow geometry encoding rewrites |
| `FeatureCollectionConverter` | `@loaders.gl/gis` | GeoJSON, Flat GeoJSON, binary feature collections |
| `GeometryConverter` | `@loaders.gl/gis` | single geometry values like WKB, WKT, TWKB, GeoJSON geometry |

## Render-Focused Conversions

Some conversions are not expressed as generic converter objects because they are rendering utilities rather than shape-dispatch nodes.

These include:

- `convertGeometryColumnToBinaryFeatureCollection()`
- `convertGeometryValuesToBinaryFeatureCollection()`
- `convertBinaryFeatureCollectionToArrowBinaryFeatureCollection()`
- `convertArrowBinaryFeatureCollectionToBinaryFeatureCollection()`

These utilities are documented in [Render converters](/docs/developer-guide/converters/render-converters).

## Why This Matters

The converter system gives you a few practical wins:

- small bundles through explicit imports
- predictable conversion paths
- reusable format-specific code in leaf modules
- a clean separation between table conversion, geometry conversion, and render conversion

The rest of this section goes converter by converter and shape by shape.
