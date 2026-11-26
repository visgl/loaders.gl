# 🧪 TLELoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`TLELoader` parses [two-line element sets (TLE)](../formats/tle.md). It converts each set to a row
with the CCSDS OMM keyword names and units. Thus TLE and OMM data give the same table schema.

| Loader         | Characteristic                                |
| -------------- | --------------------------------------------- |
| File format    | [TLE](../formats/tle.md)                      |
| File extension | `.tle`, `.3le`                                |
| Data format    | Apache Arrow `Table` or `ObjectRowTable`      |
| Supported APIs | `load`, `parse`, `parseSync` (bundled loader) |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {TLELoader} from '@loaders.gl/scientific/tle';

const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle';
const table = await load(url, TLELoader);
```

```typescript
const {data} = await load(url, TLELoader, {tle: {shape: 'object-row-table'}});
```

## Input

- The two-line form and the three-line form (a name line before each set). A `0 ` prefix on the
  name line (Space-Track 3LE) is removed.
- LF, CRLF and CR line ends, blank lines, trailing white space and a byte order mark.
- Alpha-5 catalog numbers (`A0057` is 100057). See [the format notes](../formats/tle.md).

## Shapes

| Shape              | Output                                                 |
| ------------------ | ------------------------------------------------------ |
| `arrow` (default)  | Apache Arrow `Table`                                   |
| `object-row-table` | `{shape: 'object-row-table', schema, data: OMMRow[]}`  |

## Options

| Option                   | Type    | Default   | Description                                                                                  |
| ------------------------ | ------- | --------- | -------------------------------------------------------------------------------------------- |
| `tle.shape`              | string  | `'arrow'` | Output shape.                                                                                 |
| `tle.validateChecksum`   | boolean | `true`    | When `false`, do not compare the modulo-10 checksum of each line.                             |
| `tle.skipInvalidRecords` | boolean | `false`   | When `true`, skip an invalid set and log a warning (`core.log`). When `false`, throw.         |

Error messages give the line number in the input text, for example
`TLELoader: line 2: checksum error on TLE line 1: found "0", computed 3`.

## Output schema

The output schema is the [`OMMLoader` output schema](../../omm/api-reference/omm-loader.md#output-schema).
The loader converts the TLE fields as follows.

| Column                | TLE field (line: columns)          | Conversion                                                     |
| --------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `OBJECT_NAME`         | name line                          | Trimmed. `null` for the two-line form.                         |
| `OBJECT_ID`           | 1: 10-17                           | `98067A` becomes `1998-067A`. `null` when blank.               |
| `NORAD_CAT_ID`        | 1: 3-7                             | Numeric or Alpha-5. Must agree with line 2.                    |
| `CLASSIFICATION_TYPE` | 1: 8                               | As written.                                                    |
| `EPOCH`               | 1: 19-32 (`YYDDD.DDDDDDDD`)        | ISO 8601 UTC with microseconds. Years 57-99 are 1957-1999, 00-56 are 2000-2056. |
| `MEAN_MOTION_DOT`     | 1: 34-43                           | As written (rev/day\*\*2).                                     |
| `MEAN_MOTION_DDOT`    | 1: 45-52                           | Implied decimal point and exponent: `-11606-4` is -0.11606e-4. |
| `BSTAR`               | 1: 54-61                           | Implied decimal point and exponent (1/ER).                     |
| `EPHEMERIS_TYPE`      | 1: 63                              | 0 when blank.                                                  |
| `ELEMENT_SET_NO`      | 1: 65-68                           | Integer.                                                       |
| `INCLINATION`         | 2: 9-16                            | Degrees.                                                       |
| `RA_OF_ASC_NODE`      | 2: 18-25                           | Degrees.                                                       |
| `ECCENTRICITY`        | 2: 27-33                           | Implied leading decimal point: `0007379` is 0.0007379.         |
| `ARG_OF_PERICENTER`   | 2: 35-42                           | Degrees.                                                       |
| `MEAN_ANOMALY`        | 2: 44-51                           | Degrees.                                                       |
| `MEAN_MOTION`         | 2: 53-63                           | Revolutions per day.                                           |
| `REV_AT_EPOCH`        | 2: 64-68                           | Integer.                                                       |

The epoch conversion uses integer arithmetic: 1e-8 day is exactly 864 microseconds. Thus the
`EPOCH` text is the same as the `EPOCH` of the CelesTrak OMM JSON for the same element set.

## Helpers

| Function                                              | Description                                         |
| ----------------------------------------------------- | --------------------------------------------------- |
| `parseTLEText(text, options?)`                        | Parses TLE text to `OMMRow[]`.                      |
| `convertTLEToOMMRow(line1, line2, name?, options?)`   | Converts one set to an `OMMRow`.                    |
| `computeTLEChecksum(line)`                            | Returns the modulo-10 checksum of a TLE line.       |

## Limitations

- The loader does not write TLE text.
- The loader does not propagate orbits.
