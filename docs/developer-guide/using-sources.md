# Using Sources

loaders.gl provides a number of `Source` exports that support multi-step data loading. **Sources** are different from **loaders**, in that the latter are designed for "one-shot" atomic or streaming loads of data, while a `Source` can be thought of as a multi-step or multi-resource loader. (A source can use one or more loaders internally).

**Sources** are designed encapsulates the following data access models: 

| Data Access Model           | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| ***web service**            | Interact with a web service that returns data assets for different regions etc. |
| **cloud storage**           | Read static assets as-needed from large cloud-native file formats               |
| **archive files**           | Read individual assets from a (very large) multi-asset archive files.           |
| **dynamic data generation** | Generate data (tiles, images etc) dynamically based on application requests.    |

## Source

A `Source` object provides information for creating a `DataSource` 

## DataSource Interfaces

A `DateSource` instance provides methods to query metadata, and to query data for specific geospatial areas.

A `DataSource` can (and sometimes must) expose a completely unique API. However a big advantages comes when a `DataSource` conforms to an existing Source interface. 

This means that applications written against that interface can now support the new source without any changes to existing logic.

| Source Interface   | Data access model                         | Examples                                |
| ------------------ | ----------------------------------------- | --------------------------------------- |
| `ImageSource`      | Loads image covering a region             | `WMSSource`, `_ArcGISImageServerSource` |
| `VectorSource`     | Load "features" in a region               | WFS (N/A), ArcGIS FeatureServer         |
| `ImageTileSource`  | Load image covering a specific tile index | WMTS (N/A)                              |
| `VectorTileSource` | Load "features" in a specific tile index  | Mapbox Vector Tiles, `PMTilesSource`    |

## Metadata

A `DateSource` instance provides methods to query metadata: `await dataSource.getMetadata()`.


## Adapter Sources

While most `Source` implementations provide an interface for interacting with a specific web service or cloud archive file format (e.g. `PMtilesSource`), it is also possible to create adapters:
- that provide a `Source` interface to local data (`TableTileSource`) 
- that adapts one type of Source to another (e.g. `ImageTileSource` calling an `ImageSource` to generate each tile).

## Source auto-selection

Just like the appropriate loader can be selected automatically from a list of `Loader` objects, `createDataSource()` and `selectSource()` accept a list of `Source` objects and attempt to select the correct one based on URL pattern matching, root file first bytes etc.

## Creating new Sources

Just like applications can create their own own loaders, apps can also create (and potentially contribute) their own sources and use them with loaders.gl, as long as they follow the required interfaces (e.g, every source instance must inherit from `DataSource`).

## Example

```typescript
import {TableTileSource} from '@loaders.gl/mvt';
import {GeoJSONLoader} from '@loaders.gl/json';

// build an initial index of tiles. Convieniently, 
const tileSource = new TableTileSource(load(url, GeoJSONLoader));
// request a particular tile
const features = tileSource.getTile(z, x, y).features;
```
