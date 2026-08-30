# SpatialDataSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`SpatialDataSourceLoader` opens a SpatialData Zarr root and discovers its named images, labels,
points, shapes, and tables without reading element payloads.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {SpatialDataSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/dataset.zarr', [SpatialDataSourceLoader]);
const metadata = await source.getMetadata();

const imageSource = await source.createRasterSource('image', metadata.images[0].name);
const raster = await imageSource.getRaster({level: 'auto', width: 1024, height: 768});

const expressionSource = await source.createTableArraySource('annotations', 'X');
const expression = await expressionSource.getArray({
  selection: [{start: 0, stop: 100}, {start: 0, stop: 20}]
});
```

## `getMetadata(signal?): Promise<SpatialDataSourceMetadata>`

Returns the container version, root attributes, and stable arrays for every element family. Each
`SpatialDataElementMetadata` contains:

- `kind` and `name`
- the element's Zarr `path`
- its canonical payload `url`
- a normalized `format`: `ome-zarr`, `parquet-dataset`, `geoparquet`, or `anndata-zarr`
- declared axes, coordinate transformations, encoding version, and original attributes

## `getElement(kind, name, signal?): Promise<SpatialDataElementMetadata>`

Returns one named element or rejects when the element is absent.

## `createRasterSource(kind, name, signal?): Promise<OMEZarrImageSource>`

Opens an image or label element as an OME-Zarr raster source. Raster metadata and pixel chunks are
still loaded lazily.

## `createTableArraySource(name, arrayPath, options?, signal?): Promise<ZarrArraySource>`

Opens a numeric array below an AnnData-Zarr table element. Common examples include `X`, `layers/...`,
and multidimensional arrays below `obsm` or `varm`. AnnData dataframe and categorical encodings are
retained in the element metadata but are not flattened into a single table automatically.

## Point and shape payloads

Current SpatialData encodings store points in a Dask-style Parquet dataset named `points.parquet`
and shapes in a GeoParquet file named `shapes.parquet`. Element descriptors report those canonical
URLs and preserve the group-level spatial transformations. Applications can pass the references to
the loaders.gl Parquet sources they already use. Keeping that integration explicit avoids adding the
full Parquet and GeoArrow runtime to applications that only need Zarr rasters.
