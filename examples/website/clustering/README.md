# Interactive clustering

Explore marker clustering and original-geometry selection with deck.gl.

Supported formats: GeoJSON.

A runnable example of the experimental `ClusterSource` and internal `ClusterLayer`, with 1,600
deterministic synthetic Bay Area sites. It demonstrates pixel-radius controls, count labels,
click-to-expand, paginated original members, selection, a numeric capacity sum, and polygon-centroid
clustering. Selecting a polygon member highlights its original footprint. The selected original row
survives radius and geometry
changes; cluster IDs are discarded whenever the index is rebuilt.

From the repository root:

```bash
yarn
yarn workspace clustering-loaders-example start
```

To check the standalone production build:

```bash
yarn build
yarn workspace clustering-loaders-example build
```

The dataset is generated locally with a fixed seed. The OpenFreeMap basemap requires network access;
clustering and member selection do not fetch data. The app mounts Deck and MapLibre directly and
uses deck.gl-community panels for its controls, without a React renderer. The website embeds this app at
`/examples/geospatial/clustering`.
