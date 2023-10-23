# TileJSON / Tilestats

- *[TileJSON specification](https://github.com/mapbox/tilejson-spec/blob/master/3.0.0/README.md)*
- *[Tilestats information](https://github.com/mapbox/mapbox-geostats#output-the-stats)

## TileJSON

Metadata about a tileset. 

for representing metadata about multiple types of web-based map layers, to aid clients in configuration and browsing.

As the name suggests, TileJSON is JSON encoded.

## Tilestats

Tilestats is a highly valuable inofficial "extension" to TileJSON. It provides column statistics, notably:
- the data type of each column
- min/max values for numeric columns (enabling e.g. global color scale calculations).
- a sample of values for each column

Tilestats are not always available so applications must be prepared to work in their absence.
However, tilestats is output by major tilers such as [tippecanoe](https://github.com/mapbox/tippecanoe/blob/master/README.md).


## Fields

| Data | TileJSON | tilestats | Description |
| --- | --- | --- | --- |
| 