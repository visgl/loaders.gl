# 🧪 GTFS Realtime protobuf

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

| Type | API |
| --- | --- |
| Loader | [`GTFSRealtimeLoader`](../api-reference/gtfs-realtime-loader.md) |

GTFS Realtime describes vehicle observations, estimated stop times, and service alerts that
reference a [GTFS Schedule feed](../../gtfs/formats/gtfs.md). Each response is a protobuf
`FeedMessage`. The loader supports vehicle positions and carriage details, trip descriptors
and stop predictions, and alert periods, selectors, causes, effects, and translated text.
It skips unknown fields, proto2 extensions, and payloads outside those supported messages
and fields. It decodes each feed independently and exposes differential deletion markers to
the caller.

Protobuf has no format signature. Automatic selection uses the `.gtfs-realtime` suffix.
For generic extensions and content types such as `.pb` and `application/x-protobuf`,
pass the loader explicitly.

The public GTFS reference is attributed to the GTFS community and MobilityData (CC BY).
The published protocol definition is attributed to the GTFS Specifications Authors
(Apache-2.0).

- [GTFS Realtime reference](https://gtfs.org/documentation/realtime/reference/)
- [GTFS Realtime protocol definition](https://github.com/google/transit/blob/master/gtfs-realtime/proto/gtfs-realtime.proto)
