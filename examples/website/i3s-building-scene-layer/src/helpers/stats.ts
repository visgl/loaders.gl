import {Stats} from '@probe.gl/stats';
import type {Tileset3D} from '@loaders.gl/tiles';

/**
 * Summarize statistics from array of tilesets into the stats object
 * @param {Tileset3D[]} tilesets - Source tilesets array
 * @param {Stats} stats - Destination overall stats object
 * @returns {void}
 */
export function sumTilesetsStats(tilesets: Tileset3D[], stats: Stats): void {
  stats.reset();
  for (const tileset of tilesets) {
    tileset.stats.forEach((stat) => {
      stats.get(stat.name).addCount(stat.count);
    });
  }
}
