---
title: GeoTIFFRasterLoader
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';

<GeoTiffDocsTabs active="geotiffrasterloader" />

`GeoTIFFRasterLoader` decodes original numeric TIFF samples for elevation models,
geodetic grids and scientific rasters. It returns plain objects and typed arrays,
including metadata for every selected image and band.

```typescript
import {load} from '@loaders.gl/core';
import {GeoTIFFRasterLoader} from '@loaders.gl/geotiff';

const dataset = await load('geoid.tif', GeoTIFFRasterLoader);
const image = dataset.images[0];
const heights = image.bands[0].data;
```

Samples retain their decoded numeric type and TIFF row order. The loader does not
convert to RGB, resample, reproject, replace nodata, apply band scale/offset, or
shift pixel registration. Consumers decide how to interpret these values.

For display imagery, use [`GeoTIFFLoader`](/docs/modules/geotiff/api-reference/geotiff-loader).
For remote windows and overview selection, use
[`GeoTIFFSourceLoader`](/docs/modules/geotiff/api-reference/geotiff-source-loader).
This loader downloads the complete file and decodes complete selected images into memory.

## Returned data

The exported `GeoTIFFRasterData` type contains `images: GeoTIFFRasterImage[]`.
Each image has:

| Field | Description |
| --- | --- |
| `index` | Original zero-based image directory index. |
| `width`, `height` | Original dimensions in pixels. |
| `bands` | Selected `GeoTIFFRasterBand` records in original sample order. Each contains `index`, a raw typed array `data`, and per-band GDAL `metadata`. |
| `geoKeys` | Decoded GeoKeys, or `null`. Preserves CRS and `GTRasterTypeGeoKey` (PixelIsArea / PixelIsPoint). |
| `metadata` | Image-level GDAL metadata, or `null`. Includes operation `TYPE` and any grid names / parent identifiers present in the file. |
| `noData` | Declared GDAL nodata number, or `null` when absent. |
| `fileDirectory` | Decoded TIFF tags, including `ModelPixelScale`, `ModelTiepoint`, `ModelTransformation`, `NewSubfileType`, `BitsPerSample`, and `SampleFormat` when present. |
| `crs` | EPSG identifier from projected or geographic GeoKeys when explicitly defined. User-defined CRS codes are omitted; their GeoKeys remain available. |

GDAL metadata values remain strings. Band `SCALE`, `OFFSET`, `UNITTYPE` and
`DESCRIPTION` are retained separately from image-level metadata. Nodata is declared
as a number but may be rounded in a Float32 band: compare in the band's numeric
precision before applying scale/offset. `NaN` nodata requires a non-finite check.

Images are returned in original file order. A reduced image, mask or nested grid
remains a distinct image; the loader does not infer a parent-child relationship or
silently choose an overview. Only the main IFD chain is returned as images; SubIFDs are validated by directory
preflight but are not expanded into public images. Geometry tags retain their exact
values, including nonzero tiepoint indices and rotated transforms.

The output supports `structuredClone()` and transfer of band buffers to workers.
It contains no geotiff.js instances or reader methods.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `geotiff.decoder` | `'auto' \| 'native' \| 'geotiff'` | `'auto'` | Prefer the original decoder, require it, or use compatibility decoding. |
| `geotiff.maxPixels` | `number` | 16,000,000 | Maximum pixels per selected image. |
| `geotiff.maxDecodedBytes` | `number` | 268,435,456 | Maximum selected output bytes per image. |
| `geotiff.signal` | `AbortSignal` | None | Cancel directory discovery and sample decoding. |
| `geotiff.directoryLimits.maxDirectories` | `number` | 1024 | Maximum main-chain and SubIFD directories. |
| `geotiff.directoryLimits.maxEntriesPerDirectory` | `number` | 4096 | Maximum tags per directory. |
| `geotiff.directoryLimits.maxMetadataBytes` | `number` | 16,777,216 | Cumulative encoded directory and tag-value bytes. |
| `geotiff.imageIndices` | `number[]` | All images | Select complete images by original zero-based IFD index. |
| `geotiff.bands` | `number[]` | All bands | Select bands by original zero-based sample index in every selected image. |

Selections must be nonempty, unique integer indices within range. Results remain
in original file/sample order even if the selection is unsorted. Every selected
image must contain the requested bands.

```typescript
const dataset = await load('multiband.tif', GeoTIFFRasterLoader, {
  geotiff: {imageIndices: [0], bands: [0, 2]}
});
```

## Parser loading

The root export is metadata-only. Core's asynchronous `load()` and `parse()`
automatically preload the parser on first use. To bundle the numeric parser explicitly:

```typescript
import {GeoTIFFRasterLoaderWithParser} from '@loaders.gl/geotiff/geotiff-raster-loader';
```

TIFF decompression is asynchronous; there is no `parseSync()` implementation.
The original core handles uncompressed integer and floating-point samples. Auto mode
uses geotiff.js for unsupported encodings or metadata; malformed directories and exhausted
budgets fail without fallback. See [TIFF decoder core](/docs/modules/geotiff/tiff-decoder-core).
Neither backend applies scale/offset. Array-valued native file-directory tags are plain
arrays; compatibility tags may use typed arrays. Output budgets cover returned sample
arrays; geotiff.js decompression scratch allocation is not bounded by these options.

## Using geoid grids with math.gl

The plain dataset is designed for the vertical GeoTIFF adapter in
[math.gl PR #165](https://github.com/visgl/math.gl/pull/165). With a math.gl version
that includes its plain-data input support:

```typescript
import {load} from '@loaders.gl/core';
import {GeoTIFFRasterLoader} from '@loaders.gl/geotiff';
import {Projection} from '@math.gl/projection';
import {loadVerticalGeoTIFFGrid} from '@math.gl/projection/grids/vertical-geotiff';

const dataset = await load('geoid.tif', GeoTIFFRasterLoader);
const geoid = await loadVerticalGeoTIFFGrid(dataset);
const projection = new Projection({
  from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
  verticalGrids: {local: geoid}
});

const [longitude, latitude, ellipsoidalHeight] = projection.project([10, 40, 100]);
```

Loading and preparing the grid are asynchronous; projection calls are synchronous
afterward. The math.gl adapter validates supported geoid metadata, handles nodata,
scale/offset, pixel registration and nested-grid interpolation. It currently accepts
north-up geographic degree grids with metre `geoid_undulation` bands and the
`VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL` operation type. Arbitrary scientific TIFFs
remain valid loader output but are not necessarily valid geoid grids.

The packages share a structural data contract, without a loaders.gl dependency on
`@math.gl/projection` or a math.gl dependency on a TIFF decoder.
