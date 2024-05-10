# Using Sources

loaders.gl provides a number of **sources** that support multi-step data loading. This separates them from **loaders**, which are designed for "one-shot" atomic or streaming loads of data. 

A `Source` typically provides a way to interact with a web service, with the `Source` API providing standardized methods to query metadata, and to query specific geospatial areas (whether in the form of free coordinates or pre-defined tile coordinates).

Sources can typically be classified into a number of categories:

| Source Type        | Data provided                             | Examples                     |
| ------------------- | ----------------------------------------- | ---------------------------- |
| `VectorSource`     | Load "features" in a region               | WFS, ArcGIS FeatureServer    |
| `ImageSource`      | Load image covering a region              | WMS, ArcGIS ImageServer      |
| `VectorTileSource` | Load "features" in a specific tile index  | Mapbox Vector Tiles, PMTiles |
| `ImageTileSource`  | Load image covering a specific tile index | WMTS                         |


## Pluggable Sources

An advantage of using a specific type of source abstraction in your application is that you can easily add support for other sources of the same type. For instance if you wanted to support both mapbox vector tiles and PMTiles, your would write your application against the `VectorTileSource` interface and then plug in the two sources.


## Adapter Sources

While most `Source` implementations provide an interface for interacting with some WebService or perhaps cloud archive file format (`PMtilesSource`), it is also possible to create adapters that provide a `Source` interface to local data (`TableTileSource`) or that adapts one type of Source to another (e.g. `ImageTileSource` calling an `ImageSource` to generate each tile).


## Example

```typescript
import {TableTileSource} from '@loaders.gl/mvt';
import {GeoJSONLoader} from '@loaders.gl/json';

// build an initial index of tiles. Convieniently, 
const tileSource = new TableTileSource(load(url, GeoJSONLoader));
// request a particular tile
const features = tileSource.getTile(z, x, y).features;
```


