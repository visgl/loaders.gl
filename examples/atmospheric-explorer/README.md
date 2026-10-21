# Atmospheric Explorer — ECMWF IFS analysis

Browser-side scientific field explorer using loaders.gl Zarr arrays and deck.gl GlobeView.

## Run

From the repository root, install workspace dependencies, then:

```sh
cd examples/atmospheric-explorer
yarn start
```

Run the focused grid tests with `yarn test`; build with `yarn build`.

## Data

Beyond Weather's ECMWF IFS N320 operational analysis archive is distributed using Icechunk/Zarr.

- https://registry.opendata.aws/beyond-weather-ecmwf-ifs-analysis/
- https://github.com/Beyond-Weather-Git/open-data-examples/tree/main/ifs-analysis-n320

**Important:** The current app expects an HTTP-accessible Zarr root, not a raw Icechunk repository. It does not yet resolve Icechunk snapshots or manifest references. Do not assume that entering the Icechunk S3 bucket URL will work.

## How to use

Enter a public Zarr root URL (with browser CORS support), and JSON describing:

- `array`: relative Zarr array path.
- `dimensions`: array dimension names in storage order.
- `selection`: integer indices for every non-spatial dimension.
- `grid.latitudes`: latitude of each reduced-Gaussian row in storage order.
- `grid.pointsPerLatitude`: number of points in each latitude row.
- `grid.longitudes` (optional): explicit longitude per point in flattened storage order.

The remaining dimension must be the flattened spatial point axis. The app verifies the number of field values equals the sum of row lengths. Without explicit longitudes, it assumes evenly spaced longitudes starting at 0° in each row; this assumption must be checked against the actual archive's grid convention before interpreting results.

The app displays a color-coded globe point cloud and min/max statistics. NaN values are excluded from rendering. The UI does not yet discover variables or generate Gaussian grid coordinates from ECMWF metadata.

## Implementation

- `app.ts`: Zarr metadata/selection fetch, deck.gl GlobeView, errors and aborts.
- `grid.ts`: grid expansion, shape checks, finite range and color mapping.
- `grid.spec.ts`: focused geometry and validation tests.

## Remaining work

1. Implement and test Icechunk snapshot/manifest resolution or a compatible Zarr virtual-store adapter.
2. Confirm anonymous access, CORS, chunk codecs, dataset dimensions, and coordinate conventions against the actual ECMWF archive.
3. Provide a pinned working dataset configuration and a no-setup default field.
4. Add variable/time/pressure controls, legends with physical units, and progressive chunk loading.
5. Explore wind vector fields and WebGPU particle advection.

**Status:** Working application code has been added, but no live ECMWF dataset end-to-end validation has been performed. The PR remains draft. Attribute ECMWF and Beyond Weather under CC BY 4.0.
