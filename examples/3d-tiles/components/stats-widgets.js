import {StatsWidget} from '@probe.gl/stats-widget';
import {lumaStats} from '@luma.gl/core';

export function getStatsWidget(container) {
  return new StatsWidget(lumaStats.get('Memory Usage'), {
    framesPerUpdate: 1,
    formatters: {
      'GPU Memory': 'memory',
      'Buffer Memory': 'memory',
      'Renderbuffer Memory': 'memory',
      'Texture Memory': 'memory'
    },
    container
  });
}
