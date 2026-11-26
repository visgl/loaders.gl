# 🧪 GTFSRealtimeLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`GTFSRealtimeLoader` decodes a binary [GTFS Realtime snapshot](../formats/gtfs-realtime.md).
The default output contains one row per vehicle-position entity with coordinates. Use the feed
shape to access trip updates, alerts, shapes, stops, trip modifications, deletion markers, and
vehicle reports without positions.

| Loader | Characteristic |
| --- | --- |
| Automatic selection | `.gtfs-realtime` |
| Explicit selection | Standard `.pb` and extensionless feed URLs |
| Data format | Apache Arrow `Table`, `ObjectRowTable`, or `GTFSRealtimeFeed` |
| Supported APIs | `load`, `parse`, `parseSync` (bundled loader) |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GTFSRealtimeLoader} from '@loaders.gl/scientific/gtfs-realtime';

const feed = await load('VehiclePositions.pb', GTFSRealtimeLoader, {
  gtfsRealtime: {shape: 'gtfs-realtime-feed'}
});
```

Pass `GTFSRealtimeLoader` directly to select it for generic protobuf files or URLs. For
synchronous parsing, import `GTFSRealtimeLoader` or `GTFSRealtimeLoaderWithParser` from
`@loaders.gl/scientific/gtfs-realtime/bundled`.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `gtfsRealtime.shape` | `'arrow'` | Return an Arrow vehicle table, an `'object-row-table'` with the same columns, or a `'gtfs-realtime-feed'` with the decoded header and entities. |

## Vehicle table schema

Deleted entities and vehicle reports without a position are omitted. Missing optional values
appear as `null`. The default stop status is `IN_TRANSIT_TO`.

| Column | Type | Meaning |
| --- | --- | --- |
| `timestamp` | float64 | Vehicle observation time in Unix seconds. |
| `id` | string | Feed entity identifier. |
| `vehicleId`, `vehicleLabel` | string | Vehicle identifier and passenger-facing label. |
| `tripId`, `routeId` | string | Trip and route identifiers from the vehicle's trip descriptor. |
| `directionId` | uint32 | Trip direction. |
| `startDate`, `startTime` | string | Trip start date and service-day time. |
| `longitude`, `latitude` | float64 | Decimal degrees, east and north positive. |
| `bearing` | float64 | Degrees clockwise from true north. |
| `speed` | float64 | Metres per second. |
| `currentStatus` | string | Vehicle stop status enum name. |
| `stopId` | string | Referenced GTFS Schedule stop. |
| `occupancyStatus` | string | Passenger occupancy enum name. |
| `occupancyPercentage` | uint32 | Reported passenger occupancy percentage. |

String-valued schema metadata contains `gtfsRealtimeVersion` and `incrementality`, plus
`timestamp` (feed creation time in Unix seconds) and `feedVersion` when supplied. Read these
with `table.schema.metadata.get(key)` in Arrow or `table.schema.metadata[key]` in an
object-row table.

## Decoded feed

`GTFSRealtimeFeed` contains `shape: 'gtfs-realtime-feed'`, `header`, and an `entity` array
in wire order. It uses camelCase property names and protobuf enum names. Repeated fields are
arrays, and omitted optional fields are absent unless the protocol declares an explicit default.
Each translated text or URL field contains a `translation` array with every supplied text and
language tag. Timestamps are JavaScript numbers in Unix seconds and must fit the safe integer range.

| Feed property | Contents |
| --- | --- |
| `tripUpdate.tripProperties` | Duplicate trip `tripId`, `startDate`, and `startTime`, plus `shapeId`, `tripHeadsign`, and `tripShortName` overrides. |
| `tripUpdate.stopTimeUpdate[].stopTimeProperties` | `assignedStopId` for platform assignments, `stopHeadsign`, and the `pickupType` and `dropOffType` enum names `REGULAR`, `NONE`, `PHONE_AGENCY`, and `COORDINATE_WITH_DRIVER`. |
| `alert` | Includes `ttsHeaderText`, `ttsDescriptionText`, `severityLevel` (default `UNKNOWN_SEVERITY`), `imageAlternativeText`, `causeDetail`, and `effectDetail`. `image.localizedImage` entries contain `url`, `mediaType`, and an optional `language`. |
| `shape` | `shapeId` and `encodedPolyline` as supplied by the feed. |
| `stop` | `stopId`, `stopLat`, `stopLon`, `zoneId`, `parentStation`, `stopTimezone`, `levelId`, and `wheelchairBoarding` (default `UNKNOWN`). `stopCode`, `stopName`, `ttsStopName`, `stopDesc`, `stopUrl`, and `platformCode` are translated fields. |
| `tripModifications` | `selectedTrips` groups contain `tripIds` and `shapeId`. The entity also contains `startTimes`, `serviceDates`, and `modifications`. Each modification has `startStopSelector` and `endStopSelector` (with `stopSequence` or `stopId`), `propagatedModificationDelay` (default `0` seconds), `replacementStops` (with `travelTimeToStop` in seconds and `stopId`), `serviceAlertId`, and `lastModifiedTime`. |

For a `DUPLICATED` trip, `tripUpdate.trip.tripId` identifies the original scheduled trip.
Join its update to a vehicle report by matching `tripUpdate.tripProperties.tripId` to
`vehicle.trip.tripId`. A platform assignment is available at
`tripUpdate.stopTimeUpdate[].stopTimeProperties.assignedStopId`.
