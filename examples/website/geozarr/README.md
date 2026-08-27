# GeoZarr deck.gl Example

Interactive `SourceLayer` + `GeoZarrSourceLoader` demo that:

- reads NASA POWER's public one-degree monthly climatology Zarr store directly from S3;
- selects one month or the annual mean from the non-spatial `time` dimension;
- colorizes the typed solar-irradiance raster in the browser; and
- supplies time selection and custom colorization through `RasterSourceLayer`; and
- displays the result on a navigable deck.gl map without manually constructing the source.

The remote store is CORS-enabled. Each time selection downloads one compressed global Zarr chunk
of roughly 72 KB plus metadata and coordinate chunks.
