# GeoZarr deck.gl Example

Interactive `GeoZarrSourceLoader` demo that:

- reads NASA POWER's public one-degree monthly climatology Zarr store directly from S3;
- selects one month or the annual mean from the non-spatial `time` dimension;
- colorizes the typed solar-irradiance raster in the browser; and
- displays the result on a navigable deck.gl `BitmapLayer`.

The remote store is CORS-enabled. Each time selection downloads one compressed global Zarr chunk
of roughly 72 KB plus metadata and coordinate chunks.
