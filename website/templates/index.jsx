import React from 'react';
import {Home} from 'gatsby-theme-ocular/components';
import GLTFExample from './example-gltf';
import styled from 'styled-components';

if (typeof window !== 'undefined') {
  window.website = true;
}

const ContentContainer = styled.div`
  padding: 64px;

  @media screen and (max-width: 768px) {
    padding: 48px;
  }
`;

const Bullet = styled.li`
  background: url(images/icon-high-precision.svg) no-repeat left top;
  list-style: none;
  max-width: 540px;
  padding: 8px 0 12px 42px;
  font: ${props => props.theme.typography.font300};
`;

const HeroExample = () => <GLTFExample panel={false} />

export default class IndexPage extends React.Component {
  render() {
    return (
      <Home HeroExample={HeroExample} >
        <ContentContainer>
          <ul>
            <Bullet>
              Parsers and encoders for many major 3D, geospatial and tabular formats.
            </Bullet>
            <Bullet>
              Loaders and Writers can be used with any visualization framework.
            </Bullet>
            <Bullet>
              Move your code between browser, worker threads and Node.js and rely on your loaders to keep working.
            </Bullet>
          </ul>
        </ContentContainer>
      </Home>
    );
  }
}
