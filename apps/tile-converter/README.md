# @loaders.gl/tile-converter

[loaders.gl](https://loaders.gl/docs) is a collection of framework independent 3D and geospatial parsers and encoders.

This module contains command line scripts and JavaScript APIs for converting between formats, for instance betwen 3D Tiles and I3S tilesets.

For documentation please visit the [website](https://loaders.gl).

## V5 spatial conversion

The `@loaders.gl/tile-converter/v5` entrypoint can reuse the CRS and elevation operations from
`@loaders.gl/tiles` when preparing conversion resources. Discover source metadata with
`get3DTilesSpatialReference` or `getI3SSpatialReference`, then create the matching conversion
context with an explicit target CRS or height reference when transformation is required. The
context provides double-precision positions, transformed normals and conservative bounds, plus the
spatial reference that belongs in output metadata. Required geoid grids and terrain or scene
providers are passed by the application; the conversion core does not guess a CRS or fetch spatial
resources implicitly.

```ts
import {createI3SConversionSpatialContext} from '@loaders.gl/tile-converter/v5';
import {getI3SSpatialReference} from '@loaders.gl/tiles';

const spatial = createI3SConversionSpatialContext(
  getI3SSpatialReference(layerMetadata),
  {targetCrs: 'EPSG:3857'}
);
const transformed = spatial.transformPositions(positions, nodeOrigin);
```

## V5 feature attributes

`convertFeatureAttributesToArrowBatches` writes decoded feature attributes using an explicit Arrow
schema. The schema owns property types, nested list/struct mappings, enum representations, and the
feature ID type. IDs may be strings or exact integer values (`bigint` for values outside JavaScript's
safe integer range). Unknown properties fail instead of disappearing. Supply a binary
`rawMetadataField` to retain the original encoded metadata alongside interpreted values. Pass each
source metadata class separately so its name remains attached to the batch schema.

```ts
import {convertFeatureAttributesToArrowBatches} from '@loaders.gl/tile-converter/v5';

const batches = convertFeatureAttributesToArrowBatches(features, {
  schema: {
    fields: [
      {name: 'feature_id', type: 'int64', nullable: false},
      {name: 'name', type: 'utf8', nullable: true}
    ],
    metadata: {}
  },
  batchSize: 65536
});
```

## Installation

```bash
npm install @loaders.gl/tile-converter
```
