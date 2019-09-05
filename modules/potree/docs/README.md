# potree

> potree loader development has just started. Unless you would like to contribute to development, please move on.

Loaders for the [potree](https://github.com/potree/potree) format.

```
import {load} from `@loaders.gl/core`;
import {PotreeLoader} from `@loaders.gl/potree`;
import {Tileset3D} from `@loaders.gl/category-3d-tiles`;

const potree = await load(POTREE_URL);
const tileset = new Tileset3D(potree);
const tilesToRender = tileset.traverse(frameData);
```
