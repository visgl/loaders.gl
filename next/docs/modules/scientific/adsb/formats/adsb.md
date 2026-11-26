# 🧪 ADS-B aircraft state JSON

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

| Type   | API                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------ |
| Loader | [`ADSBLoader`](https://loaders.gl/next/docs/modules/scientific/adsb/api-reference/adsb-loader.md) |

Automatic Dependent Surveillance–Broadcast (ADS-B) messages can provide aircraft identification, position and velocity. The loader reads decoded JSON snapshots in either of these layouts.

* **Named records** use a top-level `now` timestamp and an `aircraft` array of objects. The loader converts altitudes from feet to metres, ground speed from knots to metres per second, and barometric vertical rate from feet per minute to metres per second.
* **State vectors** use a top-level `time` timestamp and a `states` array of positional arrays. Altitude, speed, and vertical rate already use SI units. A `null` value for `states` produces an empty table with the same schema.

Both layouts use longitude and latitude in decimal degrees. The loader produces a flat table of aircraft state, with a timestamp for each available position update.

* [Public named aircraft record fields and units](https://streaming-docs.adsbexchange.com/reference/aircraft)
* [Public REST API state-vector definition](https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors)
