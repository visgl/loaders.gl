import {Stats} from '@probe.gl/stats';

export function initStats(url) {
  const stats = new Stats({id: url});
  return stats;
}

export function sumTilesetsStats(tilesets, stats) {
  stats.reset();
  for (const tileset of tilesets) {
    tileset.stats.forEach((stat) => {
      stats.get(stat.name).addCount(stat.count);
    });
  }
}
