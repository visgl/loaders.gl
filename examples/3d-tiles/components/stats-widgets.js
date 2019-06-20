import {StatsWidget} from '@probe.gl/stats-widget';
import {lumaStats} from '@luma.gl/core';

// const timeWidget = new StatsWidget(this.stats, {
//   title: 'Render Time',
//   framesPerUpdate: 60,
//   formatters: {
//     'CPU Time': 'averageTime',
//     'GPU Time': 'averageTime',
//     'Frame Rate': 'fps'
//   },
//   resetOnUpdate: {
//     'CPU Time': true,
//     'GPU Time': true,
//     'Frame Rate': true
//   },
//   css: {
//     position: 'absolute',
//     top: '20px',
//     left: '20px'
//   }
// });

const memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
  framesPerUpdate: 60,
  formatters: {
    'GPU Memory': 'memory',
    'Buffer Memory': 'memory',
    'Renderbuffer Memory': 'memory',
    'Texture Memory': 'memory'
  },
  css: {
    position: 'absolute',
    top: '100px',
    left: '20px'
  }
});

export function updateStatWidgets() {
  // timeWidget.update();
  memWidget.update();
}
