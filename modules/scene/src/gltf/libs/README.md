# Meshopt decoder

The decoder and declarations are copied unchanged from the MIT-licensed
meshoptimizer npm package version 1.3.0. See meshoptimizer-LICENSE.md.
Upstream: https://github.com/zeux/meshoptimizer/tree/v1.3/js

Decoder SHA-256: 10b313edaa0e322b0c1b46443f6c8b186b42139fe1eca189d50c09511d0ebedc.

Keep the development dependency pinned to the copied version when updating these files.
The decoder loads lazily from the package itself, so consumer bundlers never need
to resolve an optional npm package. Existing adapter and extension tests cover the
vendored decoder; the existing vendored-library coverage exclusion applies.
