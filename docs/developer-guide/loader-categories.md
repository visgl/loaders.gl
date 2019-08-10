# Loader Categories

loaders.gl defines "categories" of loaders that load very similar data (e.g. point clouds). When it is reasonably easy to do so, loaders.gl converts the returned data in a standardized format for that category. This allows an application to support multiple formats with a single code path, since all the loaders will return similar data structures.

Currently defined categories:

- [GIS](/docs/specifications/category-gis)
- [Mesh/PointCloud](/docs/specifications/category-mesh)
- [Scenegraph](/docs/specifications/category-scenegraph)
- [Table](/docs/specifications/category-table)
