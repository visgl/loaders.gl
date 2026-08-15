# OME-Zarr Source Example

Interactive demo for `OMEZarrSourceLoader` with:

- a local SpatialData-style Zarr v3 fixture;
- public OME-Zarr bioimaging presets from the Image Data Resource;
- custom remote store URLs;
- color-channel compositing; and
- wheel or trackpad navigation through image pyramid levels.

Remote stores must allow cross-origin browser requests. Standalone OME-Zarr images do not need
consolidated metadata; SpatialData-style store browsing uses consolidated Zarr metadata to discover
nested image groups.
