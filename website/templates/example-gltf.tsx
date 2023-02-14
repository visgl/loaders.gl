import React from 'react';

import AnimationLoopRunner from '../src/components/animation-loop-runner';
import {AppAnimationLoop} from '../../examples/website/gltf/app';

export default class Example extends React.Component {
  render() {
    return (
      <AnimationLoopRunner AnimationLoop={AppAnimationLoop} {...this.props}/>
    );
  }
}
