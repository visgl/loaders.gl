import React, {Component, createRef} from 'react';
import {renderToDOM} from 'examples/website/i3s-arcgis/app';

class ArcGISDemo extends Component {
  _containerRef = createRef();

  componentDidMount() {
    /* global document */
    // Attach arcgis stylesheet
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', 'https://js.arcgis.com/4.16/esri/themes/light/main.css');
    document.head.appendChild(style);

    renderToDOM(this._containerRef.current).then(instance => (this._view = instance));
  }

  componentWillUnmount() {
    if (this._view) {
      this._view.remove();
    }
  }

  render() {
    return <div ref={this._containerRef} style={{width: '100%', height: '100%'}} />;
  }
}

export default ArcGISDemo;
