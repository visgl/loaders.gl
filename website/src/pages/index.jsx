import React from 'react';
import {Home} from '../components';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';
import Layout from '@theme/Layout';

// import HeroExample from '../examples/home-demo';
const HeroExample = ({children}) => <div>{children}</div>;

const FeatureImage = styled.div`
position: absolute;
height: 100%;
width: 50%;
top: 0;
right: 0;
z-index: -1;
border-top: solid 200px transparent;
background-image: url(${props => props.src});
background-size: contain;
background-repeat: no-repeat;
background-position: right top;

@media screen and (max-width: 768px) {
  display: none;
}
`;

const TextContainer = styled.div`
max-width: 800px;
padding: 64px 112px;
width: 70%;
font-size: 14px;

h2 {
  font: bold 32px/48px;
  margin: 24px 0 16px;
  position: relative;
}
h3 {
  font: bold 16px/24px;
  margin: 16px 0 0;
  position: relative;
}
h3 > img {
  position: absolute;
  top: -4px;
  width: 36px;
  left: -48px;
}
hr {
  border: none;
  background: #E1E8F0;
  height: 1px;
  margin: 24px 0 0;
  width: 32px;
  height: 2px;
}
@media screen and (max-width: 768px) {
  max-width: 100%;
  width: 100%;
  padding: 48px 48px 48px 80px;
}
`;

export default function IndexPage() {
  const baseUrl = useBaseUrl('/');

  return (
    <Layout title="Home" description="deck.gl">
      <Home HeroExample={HeroExample}>
        <div style={{position: 'relative'}}>
          <FeatureImage src={`${baseUrl}images/maps.jpg`}  />
          <TextContainer>
            <h2>
              A collection of math modules for Geospatial and 3D use cases.
            </h2>
            <hr className="short" />

            <h3>
              <img src={`${baseUrl}images/icon-layers.svg`} />
              Toolbox of 3D math modules
            </h3>
            <p></p>

            <h3>
              <img src={`${baseUrl}images/icon-high-precision.svg`} />
              Matrices and vectors, bounding boxes, frustum culling etc
            </h3>
            <p></p>
            
            <h3>
            <img src={`${baseUrl}images/icon-basemap.webp`} />
              Geospatial reprojection, gravity models, solar position, etc
            </h3>
            <p></p>

            <h3>
            <img src={`${baseUrl}images/icon-react.svg`} />
              Strict TypeScript and run-time checks that detect bad data
            </h3>
            <p></p>

          </TextContainer>
        </div>
      </Home>
    </Layout>
  );
}
