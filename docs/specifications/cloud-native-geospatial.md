# Cloud Native Geospatial Formats

Author: Ib Green

There is a lot of excitement in the geospatial community about “cloud native geospatial formats”.

## The Formats

Notable characteristics of these formats are found below

| Format                    | Description                                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Big Data:                 | CNGFs are designed for big geospatial data                                                                                                                                                               |
| Serverless                | All CNGFs can be loaded by a client directly from files on e.g. s3 or a CDN without an intermediary server.                                                                                              |
| Chunked/Tiled/Pre-indexed | Data in CNGFs is structured in a way that allows clients (backend and front-end clients) to do partial reads from big files, loading just the data that is required for the geospatial region they need. |
| HTTP range requests       | A core technology that is being exploited is the ability to do a standard REST HTTP GET call but reading just the required range of bytes from a large, potentially too-large-to-load file.              |

In some cases, the files are really collections of smaller files (e.g. “tiles”) that can be read using range requests and clients are expected to load a small subset of the tiles at a time rather than the full file.

Key contenders in cloud native geospatial format category are:

| Format | Description |
| --- | --- |
| flatgeobuf (spec) | A project of passion from Björn Hartell (Norway) that started as a compact binary geojson alternative. 
The format initially gained interest because of its beautiful streaming capabilities (demo). Bjorn has kept working on it and added spatial indexing, making a good case for counting it as a cloud native geospatial format. |
| Geoparquet | Parquet is a binary columnar data format optimized for storage. Files can be chunked so that it is possible to read a range of rows without reading the whole file. Geoparquet defines metadata fields specifying which buffers contain WKB-encoded geometry. 
| Geoarrow |  Arrow is a binary columnar data format optimized for in-memory usage. Files can be chunked so that it is possible to read a range of rows without reading the whole file. Like geoparquet, geoarrow defines almost identical metadata fields specifying which buffers contain WKB-encoded geometry. |
| COG (Cloud Optimized Geotiff) |
| pmtiles | Stores of a large number of tiles in a single very big file, indexed for partial (HTTP range request) reads.  Can be cleaner than having directories of 10 - 100K tile files. |
| COPC | Store massive point clouds in a single file with additive subclouds being available for range HTTP requests. |
| STAC | STAC is not a file format but a catalog format, that complements the CNGFs above. It is generally used to describe collections of cloud optimized geotiff files, however it is a general geospatial data catalog format that is increasingly being used for more general geospatial data archives. E.g. both Amazon and Microsoft offer petabyte sized archives of satellite data indexed by STAC. |

## References

- [Cloud Native Geospatial Foundation]9https://cloudnativegeo.org/) foundation.
- [Radiant Earth](https://radiant.earth/) - Non-profit foundation, CEO Jed Sundvall (worked on Cloud-Optimized GeoTiff standard), 

