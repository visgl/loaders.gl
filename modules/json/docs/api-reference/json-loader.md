# JSONLoader

Streaming loader for comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.csv`, `.dsv`                                       |
| File Type      | Text                                                 |
| File Format    | [RFC4180](https://tools.ietf.org/html/rfc4180)       |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Usage

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

The JSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows of the first array it encounters in the JSON. To e.g. parse a stream of GeoJSON:

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await loadInBatches('geojson.json', JSONLoader);

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

## Options

| Option       | Type    | Default | Description                                                            |
| ------------ | ------- | ------- | ---------------------------------------------------------------------- |
| `json.table` | Boolean | TBD     | Parse JSON as table, i.e. return the first embedded array in the JSON. |
