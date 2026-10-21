# Atmospheric Explorer — ECMWF IFS analysis

Browser-side scientific field explorer using loaders.gl Zarr arrays and deck.gl GlobeView.

## Run

From the repository root, install workspace dependencies, then:

```sh
cd examples/atmospheric-explorer
yarn start
```

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

## Shared example information panels

This example uses `@deck.gl-community/panels` through `examples/website/shared/example-info-panel.ts`. The shared `createExampleInfoBox()` helper accepts authored About, Dataset, and Attributions sections and can be reused by other loaders.gl examples. `mountExampleInfoBox()` supports standalone DOM examples. Existing React examples can compose the returned panel container with their established panel/widget architecture. The atmospheric-specific content lives in `info.ts` and credits Jannes van Ingen for highlighting the dataset.

## Implementation

- `app.ts`: Zarr/Icechunk selection, deck.gl GlobeView, errors, aborts and panel lifecycle.
- `info.ts`: example-specific About, Dataset and Attributions tabs backed by the shared panels helper.
- `grid.ts`: grid expansion, shape checks, finite range and color mapping.
- `grid.spec.ts`: focused geometry and validation tests.

## Remaining work

1. Implement and test Icechunk snapshot/manifest resolution or a compatible Zarr virtual-store adapter.
2. Confirm anonymous access, CORS, chunk codecs, dataset dimensions, and coordinate conventions against the actual ECMWF archive.
3. Provide a pinned working dataset configuration and a no-setup default field.
4. Add variable/time/pressure controls, legends with physical units, and progressive chunk loading.
5. Explore wind vector fields and WebGPU particle advection.

**Status:** Working application code has been added, but no live ECMWF dataset end-to-end validation has been performed. The PR remains draft. Attribute ECMWF and Beyond Weather under CC BY 4.0.
