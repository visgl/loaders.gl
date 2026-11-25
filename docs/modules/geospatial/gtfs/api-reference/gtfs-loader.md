# 🧪 GTFSLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`GTFSLoader` reads [GTFS Schedule ZIP archives](../formats/gtfs.md). It returns a named
collection of CSV tables and two GeoJSON tables for drawing stops and shapes.

| Loader | Characteristic |
| --- | --- |
| Automatic selection | `.gtfs` |
| Explicit selection | Standard `.zip` archives |
| Data format | `GTFSData` |
| Supported APIs | `load`, `parse` |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GTFSLoader} from '@loaders.gl/geospatial/gtfs';

const {tables, stops, shapes} = await load('schedule.zip', GTFSLoader, {
  gtfs: {files: ['stops', 'routes', 'shapes']}
});
```

Pass `GTFSLoader` directly for generic ZIP URLs. Import `GTFSLoader` or
`GTFSLoaderWithParser` from `@loaders.gl/geospatial/gtfs/bundled` to include the parser
with the import.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `gtfs.files` | All root `.txt` files except `stop_times.txt` | Select entries by file name, with an optional `.txt` suffix. Include `stop_times` explicitly to read it. |
| `gtfs.maxRows` | `1_000_000` | Maximum rows per file, excluding the header. An excess row causes the parse to reject. |
| `gtfs.maxEntryBytes` | `64 * 1024 * 1024` | Compressed and decoded byte limit for each selected ZIP entry. |
| `gtfs.maxTotalBytes` | `256 * 1024 * 1024` | Decoded byte limit for all selected entries together. |

If the archive has no root `.txt` files and all `.txt` files are under the same top-level
folder, the loader uses that folder as the feed root. Use file names relative to that root.

`stop_times.txt` often contains millions of rows. To load it, include `'stop_times'` in
`files` and set `maxRows` high enough for the file. Large files can also need a higher
`maxEntryBytes`.

```typescript
const feed = await load('schedule.zip', GTFSLoader, {
  gtfs: {
    files: ['stops', 'trips', 'stop_times'],
    maxRows: 3_000_000,
    maxEntryBytes: 256 * 1024 * 1024
  }
});
```

## Output

- `tables` contains `GTFSTable` values keyed by file name without `.txt`. Each table uses
  `shape: 'object-row-table'` and contains `schema` and `data`. Numeric and enum columns for
  supported tables are JavaScript numbers, with missing numeric values represented by `null`.
  Identifiers, dates, times, and other text keep their source spelling. The loader trims
  surrounding ASCII spaces when parsing numbers and computing the numeric `*_seconds`
  time columns. These count from the start of the service day. For example, `25:00:00`
  gives `90000`. Empty times give `null` in the derived column.
- `warnings` contains `GTFSFileWarnings` values keyed by file name without `.txt`.
  `shortRows` counts rows with missing trailing fields, which stay absent from the row, and
  `longRows` counts rows whose extra fields were dropped. Files with neither kind of warning are omitted.
- `stops` is a `geojson-table` with Point features in longitude, latitude order. Properties
  contain the corresponding stop row. The layer includes rows with usable coordinates.
- `shapes` is a `geojson-table` with one LineString per shape ID with at least two usable
  points. Coordinates are sorted by `shape_pt_sequence`. The CSV table keeps the original
  row order.

ZIP entries are decoded one at a time and CSV records are read incrementally. The loader
retains all selected rows in memory for its result, including `stop_times` when selected.
Use `gtfs.files` to omit large tables you do not need. Raise the limits explicitly if you
need to materialize a larger feed.
