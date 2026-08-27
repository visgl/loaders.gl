# @loaders.gl/netcdf

This module contains a raster source for NetCDF. `NetCDFSource.getRaster()` selects numeric
variables and applies named dimension index or half-open range slices, returning typed raster data.
The source publishes its variables, dimensions, attributes, execution method, and raster query
capabilities through common scan metadata.

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent visualization-focused loaders (parsers).
