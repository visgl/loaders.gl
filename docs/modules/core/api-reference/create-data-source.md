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
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';

const source = await createDataSource(url, [PMTilesSourceLoader]);
// Application code here
...
```

Automatic selection is performed with best-effort heuristics.

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MVTSourceLoader} from '@loaders.gl/mvt';

const dataSource = await createDataSource(url, [PMTilesSourceLoader, MVTSourceLoader]);
await dataSource.getMetadata(...);
await dataSource.getTile(...);
```

## Functions

### createDataSource()

```ts
createDataSource(data: unknown, sources: SourceLoader[], options?: DataSourceOptions) : DataSource
```

Creates a runtime `DataSource` either using the provided source loader or source loaders.

- `data`: The resource that the data source will load from. Note that the type of the data parameter is inferred from the supplied sources. Source may support urls, Blobs, or other types of input data.
- `sources` - can be a single source loader or an array of source loaders. If a single source loader is provided, it will be used directly.
- `options`
  Returns:

- A valid runtime data source.

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
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MVTSourceLoader} from '@loaders.gl/mvt';

const dataSource = createDataSource(url, [PMTilesSourceLoader, MVTSourceLoader], {
  core: {
    // Any common options for createDataSource
  }
  pmtiles: {
    // Options specific to PMTilesSourceLoader, used if the URL is determined to reference a PMTiles file.
  },
  mvt: {
    // Options specific to MVTSourceLoader, used if the URL is determined to reference an MVT file hierarchy.
  }
});
```
