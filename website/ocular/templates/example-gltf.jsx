import React from 'react';

import AnimationLoopRunner from '../src/components/animation-loop-runner';
import animationLoop from '../examples/gltf/app';

export default class Example extends React.Component {
  render() {
    console.error('runner');
    return (
      <AnimationLoopRunner animationLoop={animationLoop} />
    );
  }
}
