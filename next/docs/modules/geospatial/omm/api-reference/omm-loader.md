# 🧪 OMMLoader

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`OMMLoader` reads the general perturbations (GP) subset of [CCSDS Orbit Mean-Elements Message (OMM)](https://loaders.gl/next/docs/modules/geospatial/omm/formats/omm.md) for SGP4. It reads the JSON form that CelesTrak (`FORMAT=json`) and Space-Track serve, and the KVN (keyword = value) form.

In KVN, the loader reads keywords between `META_START` and `META_STOP` or between `DATA_START` and `DATA_STOP`. It skips other blocks, such as covariance, through their matching `*_STOP` delimiter and treats an unterminated block as an invalid element set.

This subset uses Earth as the center (`CENTER_NAME`), TEME as the frame (`REF_FRAME`), UTC as the time system (`TIME_SYSTEM`), and SGP4 as the theory (`MEAN_ELEMENT_THEORY`). The loader assumes these values for omitted or blank fields. It accepts `SGP/SGP4` as an alias and rejects other explicit values. It trims whitespace and matches values without regard to case.

| 🧪 OMMLoader   |                                                                                |
| -------------- | ------------------------------------------------------------------------------ |
| File format    | [OMM](https://loaders.gl/next/docs/modules/geospatial/omm/formats/omm.md) |
| File extension | `.omm` (JSON is detected from its content)                                     |
| Data format    | Apache Arrow `Table` or `ObjectRowTable`                                       |
| Supported APIs | `load`, `parse`, `parseSync` (bundled loader)                                  |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {OMMLoader} from '@loaders.gl/geospatial/omm';



const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json';

const table = await load(url, OMMLoader);

// Apache Arrow table, one row for each element set

const meanMotion = table.getChild('MEAN_MOTION');
```

Use the object-row shape when the next step needs one object for each element set, for example an SGP4 library that reads OMM JSON objects:

```
const {data} = await load(url, OMMLoader, {omm: {shape: 'object-row-table'}});

for (const row of data) {

  console.log(row.OBJECT_NAME, row.NORAD_CAT_ID, row.EPOCH);

}
```

## Shapes[​](#shapes "Direct link to Shapes")

| Shape              | Output                                                      |
| ------------------ | ----------------------------------------------------------- |
| `arrow` (default)  | Apache Arrow `Table`. Field metadata `unit` gives the unit. |
| `object-row-table` | `{shape: 'object-row-table', schema, data: OMMRow[]}`       |

## Options[​](#options "Direct link to Options")

| Option                   | Type    | Default   | Description                                                                                   |
| ------------------------ | ------- | --------- | --------------------------------------------------------------------------------------------- |
| `omm.shape`              | string  | `'arrow'` | Output shape.                                                                                 |
| `omm.skipInvalidRecords` | boolean | `false`   | When `true`, skip an invalid element set and log a warning (`core.log`). When `false`, throw. |

Error messages give the location: `element set N` (1-based) for JSON, and the line number for KVN.

## Output schema[​](#output-schema "Direct link to Output schema")

`OMMLoader` and [`TLELoader`](https://loaders.gl/next/docs/modules/geospatial/tle/api-reference/tle-loader.md) return the same columns, in this order. The names are the CCSDS OMM keywords.

| Column                | Type              | Unit         | Description                                                        |
| --------------------- | ----------------- | ------------ | ------------------------------------------------------------------ |
| `OBJECT_NAME`         | utf8, nullable    |              | Spacecraft name                                                    |
| `OBJECT_ID`           | utf8, nullable    |              | International designator, for example `1998-067A`                  |
| `NORAD_CAT_ID`        | int32, nullable   |              | Satellite catalog number                                           |
| `EPOCH`               | utf8              | UTC          | Epoch, ISO 8601, for example `2026-11-23T21:54:38.454048`          |
| `MEAN_MOTION`         | float64           | rev/day      | Mean motion                                                        |
| `ECCENTRICITY`        | float64           |              | Eccentricity, 0 or more and less than 1                            |
| `INCLINATION`         | float64           | deg          | Inclination, 0 to 180                                              |
| `RA_OF_ASC_NODE`      | float64           | deg          | Right ascension of the ascending node                              |
| `ARG_OF_PERICENTER`   | float64           | deg          | Argument of pericenter                                             |
| `MEAN_ANOMALY`        | float64           | deg          | Mean anomaly                                                       |
| `EPHEMERIS_TYPE`      | int32, nullable   |              | Ephemeris type, usually 0                                          |
| `CLASSIFICATION_TYPE` | utf8, nullable    |              | `U`, `C` or `S`                                                    |
| `ELEMENT_SET_NO`      | int32, nullable   |              | Element set number                                                 |
| `REV_AT_EPOCH`        | int32, nullable   | rev          | Revolution number at epoch                                         |
| `BSTAR`               | float64, nullable | 1/ER         | SGP4 drag term (ER: earth radii)                                   |
| `MEAN_MOTION_DOT`     | float64, nullable | rev/day\*\*2 | First derivative of mean motion, as written in the TLE (see notes) |
| `MEAN_MOTION_DDOT`    | float64, nullable | rev/day\*\*3 | Second derivative of mean motion, as written in the TLE            |

Notes:

* The loader requires `EPOCH`, `MEAN_MOTION`, `ECCENTRICITY`, `INCLINATION`, `RA_OF_ASC_NODE`, `ARG_OF_PERICENTER` and `MEAN_ANOMALY`. Other columns are `null` when the input does not have them.
* Numbers can be JSON numbers or numeric strings (Space-Track JSON uses strings).
* `NORAD_CAT_ID` can also be an Alpha-5 string, for example `A0057` (100057).
* `EPOCH` keeps the text of the input. Use `parseOMMEpoch()` to get milliseconds since the Unix epoch. The loader reads dates without a zone suffix as UTC and rejects out-of-range calendar and day-of-year dates.
* `MEAN_MOTION_DOT` and `MEAN_MOTION_DDOT` have the values of the TLE fields. The TLE format defines these fields as the first derivative divided by 2 and the second derivative divided by 6. CelesTrak and Space-Track copy the TLE values into OMM unchanged, and SGP4 libraries expect these values.
* The loader checks GP metadata during parsing. It ignores `COMMENT` and `USER_DEFINED_*`.

## Helpers[​](#helpers "Direct link to Helpers")

| Function                          | Description                                                                |
| --------------------------------- | -------------------------------------------------------------------------- |
| `parseOMMText(text, options?)`    | Parses OMM JSON or KVN text to `OMMRow[]`.                                 |
| `parseOMMJSON(json, options?)`    | Converts parsed OMM JSON (an array or one object) to `OMMRow[]`.           |
| `parseOMMKVNText(text, options?)` | Parses OMM KVN text to `OMMRow[]`.                                         |
| `convertOMMObjectToRow(object)`   | Validates one OMM object and returns an `OMMRow`.                          |
| `parseOMMEpoch(epoch)`            | Converts an OMM epoch string to milliseconds since the Unix epoch.         |
| `parseAlpha5CatalogNumber(text)`  | Converts a five-character catalog number (`25544` or `A0057`) to a number. |
| `makeOMMArrowTable(rows)`         | Makes an Arrow table with the schema above.                                |
| `OMM_SCHEMA`, `OMM_COLUMNS`       | The schema above.                                                          |

## Limitations[​](#limitations "Direct link to Limitations")

* The loader does not read the OMM XML form. It throws a clear error for XML input.
* The loader does not propagate orbits. Use an SGP4 library, for example [`satellite.js`](https://github.com/shashwatak/satellite-js), with the rows.
* Covariance data, spacecraft parameters (mass, areas) and user-defined parameters are not in the output.
