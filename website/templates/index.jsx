import React from 'react';
import {Home} from 'ocular-gatsby/components';

window.website = true;

const HeroExample = require('./example-gltf').default;

export default class IndexPage extends React.Component {
  render() {
    return (
      <Home HeroExample={HeroExample}/>
    );
  }
}
