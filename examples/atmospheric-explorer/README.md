# Atmospheric Explorer (ECMWF IFS analysis)

A proposed browser-native scientific-data showcase for loaders.gl and deck.gl.

## Data

Beyond Weather's ECMWF IFS N320 operational analysis archive, published as Zarr arrays in an Icechunk repository. Dataset information: https://registry.opendata.aws/beyond-weather-ecmwf-ifs-analysis/

Reference notebooks: https://github.com/Beyond-Weather-Git/open-data-examples/tree/main/ifs-analysis-n320

## Scope

1. Resolve a public Icechunk snapshot and retrieve one variable/time/pressure-level slice using HTTP range requests where supported.
2. Decode the selected Zarr chunks into typed arrays, preserving reduced-Gaussian-grid coordinates.
3. Render the field on an interactive deck.gl globe, with a scalar-color legend.
4. Add variable, pressure-level, and time selection after the single-field path works.
5. Optionally add wind vectors and WebGPU particle advection with luma.gl.

## Browser acceptance criteria

- Anonymous, CORS-enabled access to the actual dataset; no credentials or server-side proxy.
- A reproducible pinned snapshot and explicitly documented variable/time/level selection.
- Show loading and error states; fetch only required chunks, not the full archive.
- Attribute ECMWF and Beyond Weather, and document CC BY 4.0 licensing.
- Verify the reduced Gaussian grid and coordinate ordering before rendering.

**Status:** Design scaffold. Direct Icechunk browser access, chunk codecs, and data layout have not yet been validated. This is not yet a working visualization.
