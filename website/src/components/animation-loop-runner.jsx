import React, {Component} from 'react'; // eslint-disable-line
import PropTypes from 'prop-types';
import {lumaStats} from '@luma.gl/core';
import {VRDisplay} from '@luma.gl/experimental';
import StatsWidget from '@probe.gl/stats-widget';
import {InfoPanel} from 'gatsby-theme-ocular/components';

// WORKAROUND FOR luma.gl VRDisplay
if (typeof global !== 'undefined' && !global.navigator) {
  global.navigator = {};
}

if (typeof window !== 'undefined') {
  window.website = true;
}

const STYLES = {
  EXAMPLE_NOT_SUPPPORTED: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }
};

const STAT_STYLES = {
  position: 'fixed',
  fontSize: '12px',
  zIndex: 10000,
  color: '#fff',
  background: '#000',
  padding: '8px',
  opacity: 0.8
};

const propTypes = {
  example: PropTypes.object,
  canvas: PropTypes.string
};

const defaultProps = {
  canvas: 'example-canvas'
};

const DEFAULT_ALT_TEXT = 'THIS EXAMPLE IS NOT SUPPORTED';

export default class AnimationLoopRunner extends Component {
  constructor(props) {
    super(props);
    const {AnimationLoop} = this.props;
    this.animationLoop = new AnimationLoop();
  }

  componentDidMount() {
    const {showStats} = this.props;

    this.animationLoop._setDisplay(new VRDisplay());

    // Start the actual example
    this.animationLoop.start(this.props);

    // animationLoop.stats.reset();

    if (showStats) {
      this._showStats(this.animationLoop);
    }
  }

  componentWillUnmount() {
    this.animationLoop.stop(this.props);
    this.animationLoop.delete();
    this.animationLoop = null;
    // this._stopStats();
  }

  _showStats(animationLoop) {
    const timeWidget = new StatsWidget(animationLoop.stats, {
      container: this.refs.renderStats,
      title: 'Render Time',
      css: {
        header: {
          fontWeight: 'bold'
        }
      },
      framesPerUpdate: 60,
      formatters: {
        'CPU Time': 'averageTime',
        'GPU Time': 'averageTime',
        'Frame Rate': 'fps'
      },
      resetOnUpdate: {
        'CPU Time': true,
        'GPU Time': true,
        'Frame Rate': true
      }
    });

    lumaStats.get('Memory Usage').reset();
    const memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
      container: this.refs.memStats,
      css: {
        header: {
          fontWeight: 'bold'
        }
      },
      framesPerUpdate: 60,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      }
    });

    const updateStats = () => {
      timeWidget.update();
      memWidget.update();
      this.animationFrame = window.requestAnimationFrame(updateStats);
    };

    this.animationFrame = window.requestAnimationFrame(updateStats);
  }

  _stopStats() {
    window.cancelAnimationFrame(this.animationFrame);
  }

  render() {
    const {pageContext, panel = true, stats, sourceLink} = this.props;
    const name = pageContext && pageContext.exampleConfig && pageContext.exampleConfig.title;

    const notSupported = this.animationLoop.isSupported && !this.animationLoop.isSupported();

    if (notSupported) {
      const altText = this.animationLoop.getAltText ? this.animationLoop.getAltText() : DEFAULT_ALT_TEXT;
      return (
        <div style={STYLES.EXAMPLE_NOT_SUPPPORTED}>
          <h2> {altText} </h2>
        </div>
      );
    }

    // HTML is stored on the app
    const controls = this.props.AnimationLoop.getInfo() ||
      (this.animationLoop.getInfo && this.animationLoop.getInfo());

    return (
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        {
          stats ?
          <div ref="stats" className="stats" style={STAT_STYLES}>
            <div ref="renderStats" className="renderStats"/>
            <div ref="memStats" className="memStats"/>
          </div> : null
        }
        <canvas
          id={this.props.canvas}
          style={{width: '100%', height: '100%'}}
        />
        {panel && (
          <InfoPanel title={name} sourceLink={sourceLink}>
            <div dangerouslySetInnerHTML={{__html: controls}} />
          </InfoPanel>
        )}
      </div>
    );
  }
}

AnimationLoopRunner.propTypes = propTypes;
AnimationLoopRunner.defaultProps = defaultProps;
AnimationLoopRunner.displayName = 'AnimationLoop';
