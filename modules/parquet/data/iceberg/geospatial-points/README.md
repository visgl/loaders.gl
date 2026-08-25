# Geospatial Iceberg fixture

This is a small, synthetic Apache Iceberg table created for browser examples in loaders.gl and
deck.gl. It contains 16 named reference points with `latitude` and `longitude` columns, plus a
category column. The data is intentionally compact so examples can demonstrate metadata discovery,
manifest planning, Parquet range reads, and coordinate-aware filtering without a server.

The records and generated table metadata are original work for the vis.gl project. They do not
contain copied third-party data.

The canonical table root, once published from the loaders.gl repository, is:

```text
https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/parquet/data/iceberg/geospatial-points
```

The table is read-only and uses Parquet data files with Iceberg format version 2 metadata.
