# RFC: Improved JSON Support in @loaders.gl/core

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft

## Problem: Distinguishing between JSON-based loaders

Is there a real value in allowing loaders.gl to distinguish between separate JSON based formats, especially those that all use the `.json` extension?

E.g. distinguish between JSON tables, GeoJSON, glTF JSON files, 3D tilesets, etc.

### Use-case: Drag-and-drop example

One of the vaunted advantages of loaders.gl is format and loader auto-detection

But because of the `.json` extension ambiguity parse call without a specified loader might look successful but actually returned something unexpected.

```js
import {JSONTableLoader} from '@loaders.gl/experimantal';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';

canvas.ondrop = (event) => {
  event.preventDefault();
  if (event.dataTransfer.files && event.dataTransfer.files.length === 1) {
    const data = parse(event.dataTransfer.files[0], [JSONTableLoader, Tiles3DLoader]);

    // `tileset3d.json` - was dropped, but which loader was called, what do do?
  }
};
```

In particular, distinguishing between JSON format variants seems valuable if the loader doesn't just return the unmodified JSON, or the returned JSON is supposed to be wrapped in a helper class.

In some cases (e.g. glTF) we have a JSON based format that uses a different extension. Since extension is often (but not always!) available, this dramatically mitigates the issue for those formats. But different JSON based formats often keep JSON extension (e.g. `tileset3d.json`), or perhaps supports both `.json` and a custom extension (e.g. `.geojson`).

## Proposals

### Proposal: Add json field to loaders

We currently have `text` and `binary` fields on loaders. We could add a `json` field and have loaders.gl automatically parse JSON. This would simplify defining different loaders that all are JSON based.

## Proposal: Enable JSON parser to be replaced

By letting loaders.gl handle the JSON parsing we could replace the default `JSON.parse` with error checking JSON parser, perhaps via an optional import.

## Proposal: JSON format sub-sniffing

If we mark loaders as `json` we can do an initial JSON parse (possible sniffing for well-structured JSON first `{`, `[` etc), and then sniff the contents of the parsed json by peeking at fields (`type`: `FeatureCollection` etc) with a new `loader.testJSON` method.

## Open Issues

- No metadata for
- Default JSON loader. It is probably desirable to have a default loader for json files.
