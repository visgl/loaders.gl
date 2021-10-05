import {Tileset3D} from '@loaders.gl/tiles';
import {Stats} from '@probe.gl/stats';

let stats = null;
export function initStats(url) {
  stats = new Stats({id: url});
  stats.get(Tileset3D.STATS_TILES_TOTAL);
  stats.get(Tileset3D.STATS_TILES_LOADING);
  stats.get(Tileset3D.STATS_TILES_IN_MEMORY);
  stats.get(Tileset3D.STATS_TILES_IN_VIEW);
  stats.get(Tileset3D.STATS_TILES_RENDERABLE);
  stats.get(Tileset3D.STATS_TILES_LOADED);
  stats.get(Tileset3D.STATS_TILES_UNLOADED);
  stats.get(Tileset3D.STATS_TILES_LOAD_FAILED);
  stats.get(Tileset3D.STATS_POINTS_COUNT, 'memory');
  stats.get(Tileset3D.STATS_TILES_GPU_MEMORY, 'memory');
  return stats;
}

export function sumTilesetsStats(tilesets) {
  stats.reset();
  for (const tileset of tilesets) {
    stats.forEach((stat) => {
      stat.addCount(tileset.stats.stats[stat.name].count);
    });
  }
}
