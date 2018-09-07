import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Stats from 'stats.js';

class Hero extends Component {

  componentDidMount() {
    this._stats = new Stats();
    this._stats.showPanel(0);
    if (this.refs.fps) {
      this.refs.fps.appendChild(this._stats.dom);
    }

    const calcFPS = () => {
      this._stats.begin();
      this._stats.end();
      this._animateRef = window.requestAnimationFrame(calcFPS);
    };

    this._animateRef = window.requestAnimationFrame(calcFPS);
  }

  componentWillUnmount() {
    window.onresize = null;
    window.cancelAnimationFrame(this._animateRef);
  }

  render() {
    return (
      <section ref="banner" className="banner">
        <div className="f hero">
        </div>
        <div className="container">
          <h1>loaders.gl</h1>
          <p>Framework-independent loaders for 3D graphics and geospatial formats</p>
          <Link to="/docs" className="btn">
            {'GET STARTED'}
          </Link>
        </div>
        <div ref="fps" className="fps" />
      </section>
    );
  }
}

export default Hero;
