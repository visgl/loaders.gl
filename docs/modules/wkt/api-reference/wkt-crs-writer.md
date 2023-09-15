# WKTCRSWriter

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

Writes WKT-CRS ([Well-known text representation of coordinate reference systems](../formats/wkt-crs)).

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

If you need to write WKT, or in other words, convert JSON back to WKT, use the **unparse** function.  You basically call
**unparse** on JSON data that is in the same layout as returned by **parse**.  Numbers will be stringified by your JavaScript
engine before being written and anything after `raw:` will be written directly into the output without quotes.

```typescript
import { encode } from '@loaders.gl/core';
import { WKTCRSWriter } from '@loaders.gl/wkt';

encode(WKTWriter, [
  [
    "PROJCS",
    "NAD27 / UTM zone 16N",
    [
      "GEOGCS",
      "NAD27",
      [
        "DATUM",
        "North_American_Datum_1927",
        [
          "SPHEROID",
          "Clarke 1866",
          6378206.4,
          "raw:294.9786982139006",
          ["AUTHORITY", "EPSG", "7008"]
        ],
        ["AUTHORITY", "EPSG", "6267"]
      ],
      ["PRIMEM", "Greenwich", 0, ["AUTHORITY", "EPSG", "8901"]],
      ["UNIT", "degree", "raw:0.0174532925199433", ["AUTHORITY", "EPSG", "9122"] ],
      ["AUTHORITY", "EPSG", "4267"]
    ],
    ["PROJECTION", "Transverse_Mercator"],
    ["PARAMETER", "latitude_of_origin", 0],
    ["PARAMETER", "central_meridian", -87],
    ["PARAMETER", "scale_factor", 0.9996],
    ["PARAMETER", "false_easting", 500000],
    ["PARAMETER", "false_northing", 0],
    ["UNIT", "metre", 1, ["AUTHORITY", "EPSG", "9001"]],
    ["AXIS", "Easting", "raw:EAST"],
    ["AXIS", "Northing", "raw:NORTH"],
    ["AUTHORITY", "EPSG", "26716"]
  ]
]);
// returns
{ data: `PROJCS["NAD27 / UTM zone 16N",GEOGCS["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982139006,AUTHORITY["EPSG","7008"]],AUTHORITY["EPSG","6267"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4267"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-87],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","26716"]]` }
```

## Attribution

The `WKTCRSLoader` is based on a fork of https://github.com/DanielJDufour/wkt-crs under Creative Commons CC0 1.0 license.
