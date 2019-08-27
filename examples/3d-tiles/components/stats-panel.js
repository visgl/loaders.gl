import React, {PureComponent} from 'react';
import {lumaStats} from '@luma.gl/core';
import {StatsWidget} from '@probe.gl/stats-widget';

export const STATS_IDS = {
  MEMORY: 'memory',
  TIME: 'time',
  TILESET: 'tileset'
};

const STATS_CONTAINER_STYLE = {
  position: 'absolute',
  padding: 12,
  zIndex: '10000',
  maxWidth: 300,
  background: '#000',
  color: '#fff'
};

const STATS_STYLE = {
  marginBottom: '8px',
  wordBreak: 'break-word'
};

export default class StatsPanel extends PureComponent {
  constructor(props) {
    super(props);
    this._widgets = {};
  }

  componentDidMount() {
    // TODO - This is noisy. Default formatters should already be pre-registered on the stats object
    // TODO - Revisit after upgrade luma to use most recent StatsWidget API
    this._widgets[`_${STATS_IDS.MEMORY}StatsWidget`] = new StatsWidget(
      lumaStats.get('Memory Usage'),
      {
        formatters: {
          'GPU Memory': 'memory',
          'Buffer Memory': 'memory',
          'Renderbuffer Memory': 'memory',
          'Texture Memory': 'memory'
        },
        container: this._lumaMemStats
      }
    );

    this._widgets[`_${STATS_IDS.TIME}StatsWidget`] = new StatsWidget(
      lumaStats.get('animation-loop-0'),
      {
        formatters: {
          'GPU Time': 'totalTime',
          'CPU Time': 'totalTime',
          'Frame Rate': 'fps'
        },
        container: this._lumaTimeStats
      }
    );

    this._widgets[`_${STATS_IDS.TILESET}StatsWidget`] = new StatsWidget(null, {
      container: this._loaderStats
    });
  }

  updateAll() {
    Object.values(this._widgets).forEach(w => w.update());
  }

  update(ids) {
    if (!ids) {
      return;
    }

    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    ids.forEach(id => {
      const widget = this._widgets[`_${id}StatsWidget`];
      if (widget) {
        widget.update();
      }
    });
  }

  setStats(id, stats) {
    this._widgets[`_${id}StatsWidget`].setStats(stats);
  }

  render() {
    return (
      <div style={STATS_CONTAINER_STYLE}>
        <div style={STATS_STYLE} ref={_ => (this._lumaMemStats = _)} />
        <div style={STATS_STYLE} ref={_ => (this._lumaTimeStats = _)} />
        <div style={STATS_STYLE} ref={_ => (this._loaderStats = _)} />
      </div>
    );
  }
}
