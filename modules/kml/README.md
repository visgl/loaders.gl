# @loaders.gl/kml

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders and writers for KML, KMZ, GPX, and TCX, plus a
lazy `KMZVectorSource` for archive resources and spatial feature filtering.

The XML parsers are implemented in this module using `@loaders.gl/xml`, not a
browser or Node DOM implementation. The KML parser supports common geometry
and document constructs, including folders, styles, ExtendedData, overlays,
NetworkLinks, models, timestamps, and `gx:Track`. GPX supports tracks, routes,
waypoints, elevations, timestamps, and common extensions. TCX supports
activities, laps, multi-track geometry, timestamps, heart rate, speed, power,
and summary metrics.

KMZ archives use `doc.kml` when present and expose relative archive resources
through `openKMZArchive` or `KMZVectorSource.getResource`.

Use `KMLWriter` for XML output and `KMZWriter` to package that document with
optional resource files.

KML, KMZ, GPX, and TCX loaders return Arrow tables by default. Set `*.shape`
to `'geojson-table'` or `'object-row-table'` when a row-oriented result is
needed.

For documentation please visit the [website](https://loaders.gl).
