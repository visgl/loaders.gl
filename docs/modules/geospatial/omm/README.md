# @loaders.gl/geospatial/omm

Read the general perturbations (GP) subset of CCSDS Orbit Mean-Elements Message (OMM) for SGP4.
The loader assumes an Earth center, a TEME frame, UTC, and SGP4 theory when metadata is omitted
or blank. It accepts `SGP/SGP4` as an alias and rejects other explicit values.

This entry point exports `OMMLoader`, `OMMLoaderWithParser`, the shared orbit element row schema
and small helpers.

- [OMMLoader](./api-reference/omm-loader.md)
- [OMM format](./formats/omm.md)
- [TLELoader](../tle/api-reference/tle-loader.md) returns the same row schema from two-line
  element sets.
