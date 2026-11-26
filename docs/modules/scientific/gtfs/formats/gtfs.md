# 🧪 GTFS Schedule ZIP

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

| Type | API |
| --- | --- |
| Loader | [`GTFSLoader`](../api-reference/gtfs-loader.md) |

GTFS Schedule packages transit agency details, stops, routes, trips, and service calendars
as UTF-8 CSV files at the root of a ZIP archive. The loader types the fields it recognizes
in `agency`, `stops`, `routes`, `trips`, `stop_times`, `calendar`, `calendar_dates`,
`shapes`, `frequencies`, and `feed_info`. It preserves other root `.txt` tables as
string-valued rows and reads quoted fields with embedded commas and newlines. Entry
selection lets callers read a subset of a feed.

If no `.txt` files are at the ZIP root and all `.txt` files share a single top-level
folder, the loader reads the files directly in that folder.

By default the loader reads all root `.txt` files except `stop_times.txt`, which often
contains millions of rows. The maximum is 1,000,000 data rows per file. To read stop
times, include the file explicitly and raise the limits to fit the feed.

```typescript
const feed = await load('schedule.zip', GTFSLoader, {
  gtfs: {
    files: ['stops', 'trips', 'stop_times'],
    maxRows: 3_000_000,
    maxEntryBytes: 256 * 1024 * 1024
  }
});
```

Missing trailing fields stay absent from the row. Extra fields are dropped. The
result reports both counts per affected file in `warnings`.

Automatic selection uses the `.gtfs` suffix. Pass the loader explicitly for ordinary
`.zip` feeds.

The public GTFS reference is attributed to the GTFS community and MobilityData (CC BY).

- [GTFS Schedule reference](https://gtfs.org/documentation/schedule/reference/)
