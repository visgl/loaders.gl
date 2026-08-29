# @loaders.gl/kml

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders and writers for KML and KMZ, plus a lazy
`KMZVectorSource` for archive resources and spatial feature filtering.

The KML parser is implemented in this module and supports the common KML
geometry and document constructs, including folders, styles, ExtendedData,
overlays, NetworkLinks, models, timestamps, and `gx:Track`. KMZ archives use
`doc.kml` when present and expose relative archive resources through
`openKMZArchive` or `KMZVectorSource.getResource`.

Use `KMLWriter` for XML output and `KMZWriter` to package that document with
optional resource files.

KML, KMZ, GPX, and TCX inputs can be loaded as Arrow tables by setting
`kml.shape`, `kmz.shape`, `gpx.shape`, or `tcx.shape` to `'arrow-table'`.

For documentation please visit the [website](https://loaders.gl).
