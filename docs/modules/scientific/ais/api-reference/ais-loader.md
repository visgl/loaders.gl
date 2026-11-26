# 🧪 AISLoader

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`AISLoader` reads [AIS reports](https://loaders.gl/docs/modules/scientific/ais/formats/ais.md) from `!AIVDM` and `!AIVDO` sentences and returns one table row per supported message. Multipart reports produce one row when their final fragment arrives. Applications can join vessel positions with static and voyage data by `mmsi`. Type 19 can carry position and static fields in the same row.

| 🧪 AISLoader   |                                               |
| -------------- | --------------------------------------------- |
| File extension | `.ais`, `.nmea`                               |
| Data format    | Apache Arrow `Table` or `ObjectRowTable`      |
| Supported APIs | `load`, `parse`, `parseSync` (bundled loader) |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {AISLoader} from '@loaders.gl/scientific/ais';



const table = await load('positions.ais', AISLoader, {

  ais: {shape: 'object-row-table'}

});
```

For synchronous parsing, import `AISLoader` or `AISLoaderWithParser` from `@loaders.gl/scientific/ais/bundled`.

## Options[​](#options "Direct link to Options")

| Option                   | Default   | Description                                                                                                                    |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ais.shape`              | `'arrow'` | Output shape. Use `'object-row-table'` for a table of plain objects.                                                           |
| `ais.validateChecksum`   | `true`    | Validate the XOR checksum of each NMEA sentence and its tag blocks. Checksum mismatches are discarded.                         |
| `ais.skipInvalidRecords` | `true`    | Discard malformed records. Set to `false` to throw with the source line for malformed records and incomplete multipart groups. |

Read the string-valued discard count from `table.schema.metadata.get('invalidRecordCount')` in Arrow or `table.schema.metadata.invalidRecordCount` in an object-row table. It counts rejected lines, malformed assembled messages, and incomplete fragment groups. Blank lines and unsupported message types are ignored without changing the count.

## Output schema[​](#output-schema "Direct link to Output schema")

Every row has the columns below. Fields with unavailable values or fields absent from a message have a value of `null`.

| Column                                                                          | Type    | Meaning                                                                                                                                  |
| ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`                                                                     | float64 | First available `c:` tag time in Unix seconds. Values at or above 100 billion are interpreted as Unix milliseconds and divided by 1,000. |
| `mmsi`                                                                          | int32   | Maritime Mobile Service Identity.                                                                                                        |
| `messageType`                                                                   | int32   | AIS message type.                                                                                                                        |
| `longitude`, `latitude`                                                         | float64 | Decimal degrees, east and north positive.                                                                                                |
| `speedOverGround`                                                               | float64 | Knots.                                                                                                                                   |
| `courseOverGround`                                                              | float64 | Degrees clockwise from true north.                                                                                                       |
| `heading`                                                                       | int32   | True heading in degrees.                                                                                                                 |
| `rateOfTurn`                                                                    | float64 | Signed degrees per minute. Direction-only turn codes yield `null`.                                                                       |
| `navigationStatus`                                                              | int32   | AIS navigational status code.                                                                                                            |
| `positionAccuracy`                                                              | boolean | `true` for the high-accuracy flag (10 m or better).                                                                                      |
| `name`, `callSign`, `destination`                                               | string  | Vessel or aid name, radio call sign, and voyage destination, when present.                                                               |
| `imo`, `shipType`                                                               | int32   | Reported IMO number and AIS ship and cargo type code.                                                                                    |
| `draught`                                                                       | float64 | Metres.                                                                                                                                  |
| `dimensionToBow`, `dimensionToStern`, `dimensionToPort`, `dimensionToStarboard` | int32   | Distances in metres from the position reference point.                                                                                   |
| `channel`                                                                       | string  | Channel field as received in the sentence.                                                                                               |
| `baseStationTimestamp`                                                          | float64 | UTC time broadcast by a type 4 base station, in Unix seconds.                                                                            |
