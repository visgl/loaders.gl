# 🧪 ADSBLoader

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`ADSBLoader` auto-detects the two supported [aircraft state JSON layouts](https://loaders.gl/docs/modules/scientific/adsb/formats/adsb.md) and returns one row per aircraft. Rows without a complete position are retained with both coordinates set to `null`.

| 🧪 ADSBLoader  |                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------- |
| File format    | [ADS-B aircraft state JSON](https://loaders.gl/docs/modules/scientific/adsb/formats/adsb.md) |
| Data format    | Apache Arrow `Table` or `ObjectRowTable`                                                     |
| Supported APIs | `load`, `parse`, `parseSync` (bundled loader)                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {ADSBLoader} from '@loaders.gl/scientific/adsb';



const table = await load('aircraft.json', ADSBLoader, {

  adsb: {shape: 'object-row-table'}

});
```

For synchronous parsing, import `ADSBLoader` or `ADSBLoaderWithParser` from `@loaders.gl/scientific/adsb/bundled`.

## Options[​](#options "Direct link to Options")

| Option       | Default   | Description                                                          |
| ------------ | --------- | -------------------------------------------------------------------- |
| `adsb.shape` | `'arrow'` | Output shape. Use `'object-row-table'` for a table of plain objects. |

## Output schema[​](#output-schema "Direct link to Output schema")

Missing optional values appear as `null`.

| Column                         | Type    | Meaning                                                                                                                                       |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`                    | float64 | Position time in Unix seconds. Named records use `now - seen_pos` when position and time are available. State vectors use `time_position`.    |
| `icao24`                       | string  | Aircraft transponder address.                                                                                                                 |
| `callsign`                     | string  | Aircraft call sign with whitespace trimmed.                                                                                                   |
| `longitude`, `latitude`        | float64 | Decimal degrees, east and north positive.                                                                                                     |
| `altitudeBaro`, `altitudeGeom` | float64 | Barometric and geometric altitude in metres.                                                                                                  |
| `onGround`                     | boolean | Surface status. For named records, `alt_baro: "ground"` yields `true` with a null barometric altitude, and numeric `alt_baro` yields `false`. |
| `groundSpeed`                  | float64 | Metres per second.                                                                                                                            |
| `track`                        | float64 | True track in degrees clockwise from north.                                                                                                   |
| `verticalRate`                 | float64 | Signed metres per second.                                                                                                                     |
| `squawk`                       | string  | Transponder code, including leading zeroes.                                                                                                   |
| `category`                     | string  | Source category code. Numeric state-vector codes are converted to strings.                                                                    |
