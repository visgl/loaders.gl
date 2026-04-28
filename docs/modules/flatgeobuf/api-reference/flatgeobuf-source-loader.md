import {FlatGeobufDocsTabs} from '@site/src/components/docs/flatgeobuf-docs-tabs';

# FlatGeobufSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/range_requests-From_v5.0-blue.svg?style=flat-square" alt="range requests from v5.0" />
</p>

<FlatGeobufDocsTabs active="source" />

The `FlatGeobufSourceLoader` creates an indexed vector source for remote `.fgb` datasets and serves viewport-sized feature subsets through HTTP range requests.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {FlatGeobufSourceLoader} from '@loaders.gl/flatgeobuf';

const source = createDataSource(url, [FlatGeobufSourceLoader]);

const arrowTable = await source.getFeatures({
  layers: 'dataset',
  boundingBox: [
    [-12, 35],
    [30, 60]
  ],
  format: 'arrow'
});
```

## Outputs

- `format: 'geojson'` returns a `GeoJSONTable`.
- `format: 'binary'` returns a binary feature collection.
- `format: 'arrow'` returns an Arrow table with FlatGeobuf property columns plus a WKB `geometry` column annotated with geospatial schema metadata.

## Metadata

`getMetadata()` returns one logical source layer for the dataset, including:

- dataset name and title when available
- source bounds from the FlatGeobuf header envelope
- CRS identifiers from the FlatGeobuf header
- optional `formatSpecificMetadata` when requested

## Notes

- `FlatGeobufSourceLoader` is optimized for remote URL access and expects byte-range fetches.
- Bounding box requests use the FlatGeobuf spatial index when present and return empty valid tables when nothing matches.
- Source-level reprojection matches `FlatGeobufLoader` behavior.
