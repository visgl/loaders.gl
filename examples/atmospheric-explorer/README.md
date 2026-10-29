# Atmospheric Explorer — ECMWF IFS analysis

Explore ECMWF atmospheric fields from Zarr arrays in the browser.

Supported formats: Zarr.

Browser-side scientific field explorer using loaders.gl Zarr arrays and deck.gl GlobeView.

## Run

From the repository root, install workspace dependencies and build the local loaders.gl packages, then start the example:

```sh
yarn
yarn build
cd examples/atmospheric-explorer
yarn start
```

The URL and configuration are prefilled for Beyond Weather’s public ECMWF archive. Click **Load field** to read 2 m temperature for 2011-01-01 00:00 UTC, in kelvin. The app reads one surface timestep (542,080 values) and the archive’s explicit latitude/longitude coordinates; it does not download the full archive. No AWS credentials are needed.

Run the focused grid tests with `yarn test`; build with `yarn build`.

## Data provenance, licensing and acknowledgements

This example uses and acknowledges the work of multiple independent projects and organizations:

- **ECMWF — European Centre for Medium-Range Weather Forecasts:** originator of the IFS operational atmospheric analyses. See [ECMWF](https://www.ecmwf.int/) and the specific archive's licensing and attribution requirements.
- **Beyond Weather:** prepared and published the cloud-native ECMWF IFS N320 analysis archive used for this demonstration. See the [dataset examples and documentation](https://github.com/Beyond-Weather-Git/open-data-examples/tree/main/ifs-analysis-n320).
- **AWS Open Data:** hosts/distributes the publicly documented dataset; see the [AWS dataset registry](https://registry.opendata.aws/beyond-weather-ecmwf-ifs-analysis/).
- **Earthmover:** cloud-native scientific-data infrastructure and marketplace associated with the release; see [Earthmover](https://earthmover.io/).
- **Icechunk:** transactional, versioned Zarr storage technology, developed by the Icechunk contributors; see [Icechunk](https://github.com/earth-mover/icechunk).
- **Zarrita:** JavaScript Zarr array access and decoding; see [Zarrita](https://github.com/manzt/zarrita.js).
- **vis.gl contributors:** loaders.gl and deck.gl for browser-side data access and visualization.

The dataset is described as **Creative Commons Attribution 4.0 (CC BY 4.0)**. See the [license text](https://creativecommons.org/licenses/by/4.0/) and **verify the original dataset-specific terms and exact ECMWF attribution statement before publishing screenshots, derivative data, or a hosted showcase**. Preserve source identification, license links, and any modifications or transformations made for visualization. The underlying ECMWF analysis is not produced by vis.gl, and the example is not endorsed by ECMWF, Beyond Weather, AWS, or Earthmover.

## Data

Beyond Weather's ECMWF IFS N320 operational analysis archive is distributed using Icechunk/Zarr.

- https://registry.opendata.aws/beyond-weather-ecmwf-ifs-analysis/
- https://github.com/Beyond-Weather-Git/open-data-examples/tree/main/ifs-analysis-n320

The default HTTP endpoint is `https://beyond-weather-ecmwf-ifs-analysis.s3.us-east-2.amazonaws.com/data.zarr`. It is an Icechunk repository, opened through `icechunk-js` on the `main` branch. Plain HTTP Zarr groups are also supported with `storage: "zarr"`.

## How to use

Use the prefilled configuration, or enter a public Zarr/Icechunk root URL (with browser CORS support), and JSON describing:

- `storage`: `icechunk` or `zarr`.
- `reference` (Icechunk): a branch, tag, or snapshot selector.
- `array`: relative Zarr array path.
- `dimensions`: array dimension names in storage order.
- `selection`: integer indices for every non-spatial dimension.
- `grid` (optional for Icechunk): omit to read the archive’s one-dimensional `latitude` and `longitude` arrays from the same read session. Plain Zarr stores require an explicit grid.
- `grid.latitudes`: latitude of each reduced-Gaussian row in storage order.
- `grid.pointsPerLatitude`: number of points in each latitude row.
- `grid.longitudes` (optional): explicit longitude per point in flattened storage order.

The remaining dimension must be the flattened spatial point axis. The app verifies the number of field values equals the sum of row lengths. Without explicit longitudes, it assumes evenly spaced longitudes starting at 0° in each row; this assumption must be checked against the actual archive's grid convention before interpreting results.

The app displays a color-coded globe point cloud and min/max statistics. NaN values are excluded from rendering. The UI does not yet discover variables. The default Icechunk path reads stored coordinates rather than generating an approximate grid.

## Shared example information panels

This example uses `@deck.gl-community/panels` through `examples/website/shared/example-info-panel.ts`. The shared `createExampleInfoBox()` helper accepts authored About, Dataset, and Attributions sections and can be reused by other loaders.gl examples. `mountExampleInfoBox()` supports standalone DOM examples. Existing React examples can compose the returned panel container with their established panel/widget architecture. The atmospheric-specific content lives in `info.ts` and credits Jannes van Ingen for highlighting the dataset.

## Implementation

- `app.ts`: Zarr/Icechunk selection, deck.gl GlobeView, errors, aborts and panel lifecycle.
- `info.ts`: example-specific About, Dataset and Attributions tabs backed by the shared panels helper.
- `grid.ts`: grid expansion, shape checks, finite range and color mapping.
- `grid.spec.ts`: focused geometry and validation tests.

## Remaining work

1. Provide variable/time/pressure controls and progressive chunk loading.
2. Add richer legends and geographic context.
3. Explore wind vector fields and WebGPU particle advection.

**Status:** The default ECMWF surface field has been validated end to end in Chromium, including anonymous CORS access, Icechunk resolution, Blosc chunk decoding, and explicit coordinates. The PR remains draft. Attribute ECMWF and Beyond Weather under CC BY 4.0.
