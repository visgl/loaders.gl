# 🧪 AIS (Automatic Identification System)

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

| Type   | API                                                                                       |
| ------ | ----------------------------------------------------------------------------------------- |
| Loader | [`AISLoader`](https://loaders.gl/docs/modules/scientific/ais/api-reference/ais-loader.md) |

AIS transponders broadcast position, identification, and other reports over maritime VHF. Receiver logs can wrap those reports in NMEA 0183 sentences, using six-bit armoring to carry the binary payload as printable text.

`AISLoader` reads `!AIVDM` and `!AIVDO` sentences, one per line. It accepts leading NMEA tag blocks and reads the `c:` time tag. It ignores other tag fields and suffixes separated from the sentence checksum by whitespace or a comma, including trailing log timestamps. Multipart fragments must arrive in order within each sequence and channel. A multipart group without a sequence identifier can be assembled when it is the only such group in progress on its channel for that sentence kind.

The loader reads message types 1, 2, and 3 (Class A position), 4 (base station position and UTC), 5 (static and voyage), 18 (Class B position), 19 (extended Class B), 21 (aid to navigation), 24A and 24B (Class B static data), and 27 (long-range position). Messages of other types are ignored. Type 27 carries integer knots and degrees rather than tenths and uses lower-resolution coordinates.

* [ITU-R M.1371-5, Annex 8 message layouts](https://www.itu.int/dms_pubrec/itu-r/rec/m/R-REC-M.1371-5-201402-S%21%21PDF-E.pdf)
* [Public description of AIVDM/AIVDO framing and armoring](https://gpsd.io/AIVDM.html)
