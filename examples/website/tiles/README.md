# Tile viewing and browser PMTiles export

Run `yarn` and `yarn build` from the repository root, then
`yarn workspace tiles-loaders-example start`. Open `/authoring.html` for the export form;
the website embeds the same component at `/examples/tiles/pmtiles-authoring`.

The offline sample generates MVT or MLT in PMTiles without fetching data. Local file selection,
drag and drop, and HTTP(S) URLs support GeoJSON, GeoArrow IPC/Feather, and byte GeoTIFF/COG.
The URL path need not identify the format: select it explicitly. Remote servers must allow CORS.

Select geographic bounds and one zoom (0–8). The example exports whole intersecting XYZ tiles,
including each tile's normal clipping buffer for vectors. Bounds do not crop the output to the
exact requested rectangle. Antimeridian-crossing bounds are not supported in this first example.

The example delegates indexing/clipping to the existing GeoArrow tiler and encoding/packaging to
`@loaders.gl/pmtiles/geoarrow` and `@loaders.gl/pmtiles/raster`. It adds no conversion algorithms.
Only the selected parser is loaded. Conversion uses the page thread; worker delivery remains
separate work. Cancellation can interrupt transport and library checkpoints, but synchronous table
parsing/indexing or encoding may briefly pause the page before observing cancellation.

Limits: 32 MiB encoded input, 50,000 input/per-tile vector rows, 64 requested addresses (including
empty tiles), and a 32 MiB archive. The entire remote input is downloaded with a streamed byte cap;
this example does not use COG range reads. These are not peak-heap limits: parsing and decompression
can allocate before the decoded row limit is checked. Use small datasets. All-empty exports fail.

Vector geometry must follow the tiler's longitude/latitude contract. Select scalar attributes or
omit attributes when richer columns are present. Raster output requires display-ready uint8
imagery in EPSG:3857, EPSG:4326 or OGC:CRS84; choose gray, gray/alpha, RGB or RGBA bands. Styling
scientific values, palettes and other CRS reprojection require preprocessing.

Generated object URLs are revoked when replaced, settings change, or the component unmounts.
The source raster is finalized by the example after every export, including errors/cancellation.
No data is uploaded. After generating the archive, use its download link and open it in the
existing PMTiles viewer.
