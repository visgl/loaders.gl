// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {runFixedFrameExample} from './example.mjs';

const {tiles} = await runFixedFrameExample();
console.table(tiles.map(tile => ({matrix: tile.tileMatrix, ...tile.index, id: tile.id})));
