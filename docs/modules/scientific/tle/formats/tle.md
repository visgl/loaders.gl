# 🧪 TLE (Two-Line Element Set)

## loaders.gl support

| Type   | API                                                   |
| ------ | ----------------------------------------------------- |
| Loader | [`TLELoader`](../api-reference/tle-loader.md)         |

## Format

A two-line element set (TLE) is a fixed-column text format for the mean orbital elements of one
Earth-orbiting object. The elements are for the SGP4/SDP4 propagation models. They are not
osculating elements, so use them only with SGP4.

- Each set has two lines of 69 characters. Line 1 starts with `1 ` and line 2 starts with `2 `.
- An optional name line (line 0) comes before the two lines. This is the "three-line" form.
  Space-Track 3LE files put `0 ` before the name.
- Column 69 of each line is a modulo-10 checksum: the sum of the digits in columns 1 to 68, plus
  1 for each minus sign.
- Some fields have an implied decimal point. The eccentricity `0007379` is 0.0007379. The
  `BSTAR` and second-derivative fields also have an exponent: ` 10921-3` is 0.10921e-3.
- The epoch is `YYDDD.DDDDDDDD`: a two-digit year and a fractional day of the year, in UTC.
  Years 57 to 99 are 1957 to 1999. Years 00 to 56 are 2000 to 2056.
- The mean motion derivative fields hold the first derivative divided by 2 and the second
  derivative divided by 6. SGP4 uses only `BSTAR`.

### Alpha-5 catalog numbers

The catalog number field has five characters. For catalog numbers from 100000 to 339999, the
Alpha-5 form replaces the first two digits with a letter: `A` is 10, `B` is 11, and so on to `Z`
(33). The letters `I` and `O` are not used, because they look like the digits 1 and 0. For
example, `A0057` is 100057 and `Z9999` is 339999. Catalog numbers above 339999 do not fit in a
TLE. Use [OMM](../../omm/formats/omm.md) for these objects.

## References

- T.S. Kelso, _Frequently Asked Questions: Two-Line Element Set Format_, CelesTrak.
  https://celestrak.org/columns/v04n03/
- Space-Track, _Two-Line Element Set Format_ and _Alpha-5_ documentation.
  https://www.space-track.org/documentation#/tle
- F.R. Hoots and R.L. Roehrich, _Spacetrack Report No. 3: Models for Propagation of NORAD Element
  Sets_, 1980. https://celestrak.org/NORAD/documentation/spacetrk.pdf
- D.A. Vallado, P. Crawford, R. Hujsak and T.S. Kelso, _Revisiting Spacetrack Report #3_,
  AIAA 2006-6753, 2006. https://celestrak.org/publications/AIAA/2006-6753/
