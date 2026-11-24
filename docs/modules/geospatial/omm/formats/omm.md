# OMM (Orbit Mean-Elements Message)

## loaders.gl support

| Type   | API                                                   |
| ------ | ----------------------------------------------------- |
| Loader | [`OMMLoader`](../api-reference/omm-loader.md)         |

## Format

The Orbit Mean-Elements Message (OMM) is one of the Orbit Data Messages of the Consultative
Committee for Space Data Systems (CCSDS). An OMM gives the mean Keplerian elements of one object
at one epoch, for a specified mean element theory. For SGP4 element sets
(`MEAN_ELEMENT_THEORY = SGP4`), the message also has the TLE-related parameters: catalog
number, element set number, revolution number, `BSTAR` and the mean motion derivatives.

The standard defines three encodings:

- **KVN** (keyword = value notation): one keyword on each line, with optional units in square
  brackets, for example `MEAN_MOTION = 15.49568558 [rev/day]`. `OMMLoader` reads this form.
  Each `CCSDS_OMM_VERS` line starts a new message.
- **XML**: defined by the CCSDS Navigation Data Messages XML schema. `OMMLoader` does not read
  this form yet.
- **JSON**: not part of CCSDS 502.0-B-3. CelesTrak and Space-Track serve OMM data as a JSON
  array of objects with the OMM keywords as keys. `OMMLoader` reads this form.

CelesTrak recommends OMM instead of TLE for new software, because TLE catalog numbers are limited
to five characters. See the TLE notes on [Alpha-5 catalog numbers](../../tle/formats/tle.md).

## Data sources

- CelesTrak GP data: `https://celestrak.org/NORAD/elements/gp.php?GROUP=<group>&FORMAT=json`
  (or `FORMAT=kvn`, `FORMAT=xml`, `FORMAT=tle`). Read the CelesTrak usage policy before you
  download data in an application.
- Space-Track (`https://www.space-track.org`) serves the same data to registered users.

## References

- CCSDS 502.0-B-3, _Orbit Data Messages_, Recommended Standard (Blue Book), Issue 3, April 2023,
  section 4 (OMM). https://public.ccsds.org/Pubs/502x0b3e1.pdf
- T.S. Kelso, _A New Way to Obtain GP Data (aka TLEs)_, CelesTrak.
  https://celestrak.org/NORAD/documentation/gp-data-formats.php
- D.A. Vallado, P. Crawford, R. Hujsak and T.S. Kelso, _Revisiting Spacetrack Report #3_,
  AIAA 2006-6753, 2006. https://celestrak.org/publications/AIAA/2006-6753/
