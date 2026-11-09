# Module test directory layout

Tests live under modules/<module>/test, alongside modules/<module>/src.
Directories for a public subpath or implementation component should use the same name
as the corresponding source directory. Do not retain a -package suffix after moving
an old package into a module subpath.

The November 2026 audit inspected every modules/*/src and modules/*/test tree. It removes
five historical Core -package suffixes and aligns the Tiles tileset-2d and Tiles-3D
tileset-3d directories. Imports, TypeScript paths, benchmark aliases, audit scripts,
fixture allowlists and slow-test inventory references move with the tests.

Not every test directory must mirror src byte-for-byte. Format-oriented groups such as
Documents XML/config/BSON, Images textures/video and Scientific NPY describe supported
formats whose implementations are currently flat or under lib. Shared data, fixtures,
test-utils and integration groups remain meaningful test-only directories. Those are
not historical package names and should not be mechanically folded into lib.

When moving tests, preserve fixture bytes and relative import depth where practical.
Update all package test entrypoints and test/aliases.ts, run test-audit, and verify both
Node and Chromium discovery. Do not add duplicate discovery or lower coverage thresholds.
