# RFC: Improved JSON Support in loaders.gl

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft


## Proposal: Add json field to loaders

We currently have `text` and `binary` fields on loaders. We could add a `json` field and have loaders.gl automatically parse JSON. This would simplify defining different loaders that all are JSON based.

## Proposal: Enable JSON parser to be replaced

By letting loaders.gl handle the JSON parsing we could replace the default `JSON.parse` with error checking JSON parser, perhaps via an optional import.


## Open Issues

Is there a real value in allowing loaders.gl to distinguish between separate JSON based formats, especially those that all use the `.json` extension?

E.g. distinguish between JSON tables, GeoJSON, glTF JSON files, 3D tilesets, etc.

Drag-and-drop example

```js
import {GLTFLoader} from '@loaders.gl/gltf';
import {Tileset3DLoader} from '@loaders.gl/3d-tiles';

canvas.ondrop = event => {
  event.preventDefault();
  if (event.dataTransfer.files && event.dataTransfer.files.length === 1) {
    const data = parse(event.dataTransfer.files[0], [GLTFLoader, Tileset3DLoader]);
    // What do do?
  }
};
```

A parse call without a specified loader might look successful but actually returned something unexpected.

In particular, distinguishing between JSON format variants seems valuable if the loader doesn't just return the unmodified JSON, or the returned JSON is supposed to be wrapped in a helper class.

Different JSON based formats often keep JSON extension.


