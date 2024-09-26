# createDataSource

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

This function creates a `DataSource` for an
(i.e. parses the entire data set in one operation). It can be called on "already loaded" data such as `ArrayBuffer` and `string` objects.

In contrast to `load` and `parse` which parse a single file, the returned `DataSource` is a a class instance that offers an API for querying additional data (such as tiles from a tile server).

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch `Response` object and can be passed directly to the non-sync parser functions:

```typescript
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';

const source = await createDataSource(url, [PMTilesSource]);
// Application code here
...
```

Automatic selection is performed with best-effort heuristics.

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {MVTSource} from '@loaders.gl/mvt';

const dataSource = await createDataSource(url, [PMTilesSource, MVTSource]);
await dataSource.getMetadata(...);
await dataSource.getTile(...);
```

## Functions

### createDataSource()

```ts
createDataSource(data: unknown \*, sources: Source\[], options?: DataSourceOptions) : Promise\<DataSource\>
```

Parses data asynchronously either using the provided source or sources, or using the pre-registered sources (see `register-sources`).

- `data`: The resource that the data source will load from. Note that the type of the data parameter is inferred from the supplied sources. Source may support urls, Blobs, or other types of input data.
- `sources` - can be a single source or an array of sources. If single source is provided, will force to use it. If ommitted, will use the list of pre-registered sources (see `registerLoaders`)
- `options`
  Returns:

- A valid data source or null.

## Options

Sources accept nested options, so that options for multiple sources can be specified:

| Option              | Type            | Default  | Description                                                                                                                                                          |
| ------------------- | --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core.type`         | `string`        | `'auto'` | Specifies that a specific source should be created from the supplied `sources`. `'auto'` (default) makes a best effort to select the source that matches the `data`. |
| `core.attributions` | `string[]`      | `[]`     | While sources make a best effort to extract attribution information from the source data, it is sometimes necessary to manually provide the required attributions.   |
| `core.loadOptions`  | `LoaderOptions` | `{}`     | A source can sometimes use one or more loaders internally to load sub resources. The application can pass options to those loaders using this option.                |
| `core.loaders`      | `Loader[]`      | `[]`     | If a source is using loaders to loader a subresource, the application can add additional loaders to support more formats.                                            |

```ts
import {createDataSource} from '@loaders.gl/core';
import {PMTileseSource} from '@loaders.gl/pmtiles';
import {MVTSource} from '@loaders.gl/mvt`;

const dataSource = createDataSource(url, [PMTileSource, MVTSource], {
  core: {
    // Any common options for createDataSource
  }
  pmtiles: {
    // Options specific to PMTilesSource, used if the URL is determined to reference a PMTiles file.
  },
  mvt: {
    // Options specific to MVTSource, used if the URL is determined to reference an MVT file hierarchy.
  }
});
```
