# WKTCRSLoader 🆕 🚧

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Parses WKT-CRS ([Well-known text representation of coordinate reference systems](../formats/wkt-crs)).

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

# Usage

```typescript
// you can skip this line if you loaded via <script>
import {WKTCRSLoader} from '@loaders.gl/wkt';
import {parse} from '@loaders.gl/core'

// a string of Well-Known Text CRS
const wkt = `PROJCS["NAD27 / UTM zone 16N",GEOGCS["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982139006,AUTHORITY["EPSG","7008"]],AUTHORITY["EPSG","6267"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4267"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-87],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","26716"]]`;

// parses WKT-CRS string to nested arrays
const data = parse(wktcrsText, WKTCRSLoader);
```

## Data Format

```typescript
[
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
          294.9786982139006,
          ["AUTHORITY", "EPSG", "7008"]
        ],
        ["AUTHORITY", "EPSG", "6267"]
      ],
      ["PRIMEM", "Greenwich", 0, ["AUTHORITY", "EPSG", "8901"]],
      ["UNIT", "degree", 0.0174532925199433, ["AUTHORITY", "EPSG", "9122"] ],
      ["AUTHORITY", "EPSG", "4267"]
    ],
    ["PROJECTION", "Transverse_Mercator"],
    ["PARAMETER", "latitude_of_origin", 0],
    ["PARAMETER", "central_meridian", -87],
    ["PARAMETER", "scale_factor", 0.9996],
    ["PARAMETER", "false_easting", 500000],
    ["PARAMETER", "false_northing", 0],
    ["UNIT", "metre", 1, ["AUTHORITY", "EPSG", "9001"]],
    ["AXIS", "Easting", "EAST"],
    ["AXIS", "Northing", "NORTH"],
    ["AUTHORITY", "EPSG", "26716"]
  ]
]
```

## Advanced Usage

### special properties

We've also added special properties to the arrays, to ease lookup.  For each subarray,
we add its keyword as a property to its parent.  For example, you can look up the datum ,
using `data.PROJCS.GEOGCS.DATUM` instead of `data[0][2][2]`.

### repeated keywords

Sometimes WKT will repeat some keywords for the same array.  For example, you might have multiple
"PARAMETER[...]" as in the above example.  In this case, you will find an array of the multiple at
`"MULTIPLE_{KEYWORD}"`, as in `"MULTIPLE_PARAMETER"`.

### raw mode

By default, wkt-crs automatically converts any number to its JavaScript Float64 representation 
and converts variable keywords to strings.  If you need to preserve raw literal values as they appears in the WKT,
call parse with an options object where `raw` is `true`.  You might prefer raw mode if you want to recreate the original WKT later, don't trust the floating point precision of JavaScript numbers, or need to distinguish between a string with the same value as a variable name.

```typescript
parse(`UNIT["degree",0.0174532925199433,AUTHORITY["EPSG", "9122"]]`, WKTCRSLoader, { raw: true });
{
  data: [
    // the first item in an array is always the keyword name of the array,
    // so there's no need for "raw:UNIT"
    "UNIT",
    
    // "degree" appears as a string in the source wkt
    // with quotes around it, so there's no need to change it
    "degree",
    
    // number is exactly the same as it appears in the wkt
    "raw:0.0174532925199433",
    
    ["AUTHORITY", "EPSG", "9122"]
  ]
}

parse(`AXIS["Easting",EAST]`, WKTCRSLoader, { raw: true });
{
  data: [
    "AXIS",
    "Easting",
    "raw:EAST" // attribute is equal to the variable EAST and not the string "EAST"
  ]
}
```
### sorting

You can sort the keywords in the parsed object.

```typescript
parse(data, WMTCRSLoader)

 [
  'EXAMPLE',
  [ 'AXIS', 'Northing', 'raw:NORTH' ],
  [ 'AXIS', 'Easting', 'raw:EAST' ],
];
```

```typescript
parse(data, WMTCRSLoader, { sort: true })
[
  'EXAMPLE',
  [ 'AXIS', 'Easting', 'raw:EAST' ],
  [ 'AXIS', 'Northing', 'raw:NORTH' ]
];
```

```typescript
// only sort specific keywords
parse(data, WMTCRSLoader, { keywords: ["PARAMETER"] })
```

## Attribution

The `WKTCRSLoader` is based on a fork of https://github.com/DanielJDufour/wkt-crs under Creative Commons CC0 1.0 license.
