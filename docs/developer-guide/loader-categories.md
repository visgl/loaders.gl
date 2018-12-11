# Loader Categories

loaders.gl defines "categories" of loaders that load very similar data (e.g. point clouds). When it is reasonably easy to do so, loaders.gl converts the returned data in a standardized format for that category. This allows an application to support multiple formats with a single code path, since all the loaders will return similar data structures.


Currently defined categories:

* GLTF
* Point Clouds
* Meshes (overlaps with Point Clouds and shares format)
* Geospatial


## Common Format of Loaded Data

On a successful parse, all loaders will return a data object with a minimal standardized payload as follows:

| Field | Type | Contents |
| ---   | --- | --- |
| `loaderData` | `Object` (Optional) |  Loader and format specific data, such as e.g. original header fields. Can correspond one-to-one with the data in the specific file format itself, or be defined by the loader. |
| `header`       | `Object` | Standardized header information - can contain number of vertices, etc. |
| `...`          | `*` | Standardized data, depends on which "category" the loader conforms to |

> `loaderData` should not be considered stable between releases, since loaders.gl can choose to replace the underlying loader for performance or feature reasons.


### Binary Data

loaders.gl will attempt to load any data that is a contiguous array of numbers as a typed array (causing that data to be stored as a contiguous array of binary memory).
