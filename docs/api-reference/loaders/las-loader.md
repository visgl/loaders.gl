# LASLoader (@loaders.gl/las)

The LASER (LAS) file format is a public format for the interchange of 3-dimensional point cloud data data, developed for LIDAR mapping purposes.

* [LASER FILE FORMAT](https://www.asprs.org/divisions-committees/lidar-division/laser-las-file-format-exchange-activities)
* Note: LAZ is the compressed version of LAS


## Usage

```
import {LASLoader} from '@loaders.gl/las';
import {loadFile} from '@loaders.gl/core';

loadFile(url, LASLoader, options).then(data => {
  // Application code here
  ...
});
```

## Options

TBA


## Data Loaded

TBA
