# GTFS Transit Map

See GTFS Schedule route shapes and stops alongside GTFS Realtime vehicle positions on a deck.gl and MapLibre map. Zoom to level 12 to see stops, and hover over a vehicle for its trip, stop, and movement details.

## Run locally

From the repository root, install the workspace dependencies with `yarn`, then run:

```sh
cd examples/website/gtfs
yarn start
```

The Vite development server proxies `/feeds/mbta/` to `https://cdn.mbta.com/`. It loads `MBTA_GTFS.zip` and `realtime/VehiclePositions.pb` by default. The Schedule loader reads only `routes`, `trips`, `shapes`, and `stops`.

Live feeds need CORS headers or a proxy. On the deployed loaders.gl website, enter CORS-enabled feed URLs or drop a local Schedule `.zip` or VehiclePositions `.pb` onto the map. You can replace either source independently. A dropped Realtime file is displayed as a single snapshot.

## Query parameters

| Parameter | Value |
| --- | --- |
| `static` | GTFS Schedule ZIP URL |
| `realtime` | GTFS Realtime VehiclePositions protobuf URL |
| `refresh` | Seconds between Realtime requests. Defaults to `15`. |

URL-encode feed URLs that contain query strings. To change the refresh interval for the local MBTA feeds, open the example with `?refresh=30`.

Transit data: [MBTA](https://www.mbta.com/developers).

TODO: Add a map screenshot at `website/static/images/examples/geospatial/gtfs.jpg` for the website gallery.
