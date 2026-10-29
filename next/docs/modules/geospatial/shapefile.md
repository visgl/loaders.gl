Shapefile module

SHP

# Read the geometry and attributes that travel together.

`@loaders.gl/geospatial/shapefile` loads the familiar `.shp` geometry and companion attribute files into geospatial table data. Use the archive loader for a complete dataset or the lower-level SHP loader for geometry-only input.

[Shapefile format](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[Shapefile loader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[GIS category](https://loaders.gl/next/docs/specifications/category-gis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-gis.md)

The Shapefile path

## Read the dataset pieces. Join them into usable features.

Shapefile is a small family of related files. The high-level loader coordinates the pieces so application code can work with geometry and properties together.

01

Input

Shapefile archive or individual \`.shp\` data

02

Geometry

Points, lines, polygons, and multipart records

03

Attributes

DBF properties and optional projection metadata

04

Output

Geospatial table data

Detailed guide

## Loader and file-part details

The reference below covers installation, the complete archive loader, the geometry-only loader, companion files, and geospatial output.

The `@loaders.gl/geospatial/shapefile` module handles the [Shapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md) format, a widely used binary format.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader                                                                                                                | Description                                       |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`ShapefileLoader`](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md) | Loads Shapefile archives as geospatial tables.    |
| [`SHPLoader`](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)             | Loads individual Shapefile `.shp` geometry files. |

## Attribution[​](#attribution "Direct link to Attribution")

The Shapefile loaders were written from scratch for loaders.gl.
