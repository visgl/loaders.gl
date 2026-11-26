# 🧪 GTFS Realtime protobuf

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

| Type   | API                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Loader | [`GTFSRealtimeLoader`](https://loaders.gl/docs/modules/scientific/gtfs-realtime/api-reference/gtfs-realtime-loader.md) |

GTFS Realtime describes vehicle observations, estimated stop times, and service alerts that reference a [GTFS Schedule feed](https://loaders.gl/docs/modules/scientific/gtfs/formats/gtfs.md). Each response is a protobuf `FeedMessage`. The decoded feed includes vehicle positions and carriage details, trip and stop-time properties, alerts with localized images and text-to-speech fields, and realtime shape, stop, and trip modification entities. Trip properties identify duplicated trips so consumers can match them to vehicle reports. Stop-time properties carry platform assignments and pickup and drop-off changes.

The loader decodes each feed independently and exposes differential deletion markers to the caller. It skips unknown protobuf fields, including the proto2 extension ranges `1000`–`1999` and `9000`–`9999`.

Protobuf has no format signature. Automatic selection uses the `.gtfs-realtime` suffix. For generic extensions and content types such as `.pb` and `application/x-protobuf`, pass the loader explicitly.

The public GTFS reference is attributed to the GTFS community and MobilityData (CC BY). The published protocol definition is attributed to the GTFS Specifications Authors (Apache-2.0).

* [GTFS Realtime reference](https://gtfs.org/documentation/realtime/reference/)
* [GTFS Realtime protocol definition](https://github.com/google/transit/blob/master/gtfs-realtime/proto/gtfs-realtime.proto)
