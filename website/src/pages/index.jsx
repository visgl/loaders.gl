import React from 'react';
import {Home} from '../components';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';
import Layout from '@theme/Layout';
import HeroExample from '../examples/home-demo';

const FeatureImage = styled.div`
  position: absolute;
  height: 100%;
  width: 50%;
  bottom: 0;
  right: 0;
  z-index: -1;
  background: url(${(props) => props.src});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: bottom right;
  @media screen and (max-width: 1420px) {
    width: 37%;
  }
  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const TextContainer = styled.div`
  max-width: 800px;
  padding: 50px 112px 50px 80px;
  width: 70%;
  font-size: 14px;

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

  @media screen and (max-width: 768px) {
    max-width: 100%;
    width: 100%;
    padding: 48px 80px;
  }
`;

const Description = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: center;

  h2 {
    font: bold 32px/48px;
    margin: 24px 0;
    position: relative;
  }
  > img {
    width: 3em;
    height: 3em;
    @media screen and (max-width: 768px) {
      display: none;
    }
  }
`;

const Bullet = () => {
  return <img src="/images/icon-high-precision.svg" />;
};

export default function IndexPage() {
  const baseUrl = useBaseUrl('/');

  return (
    <Layout title="Home" description="deck.gl">
      <Home HeroExample={HeroExample}>
        <div style={{position: 'relative'}}>
          <FeatureImage src={`${baseUrl}images/maps.jpg`} />
          <TextContainer>
            <Description>
              <Bullet />
              <h2>Parsers and encoders for major geospatial, tabular and 3D formats.</h2>
            </Description>
            <Description>
              <Bullet />
              <h2>Can be used with any JavaScript applications.</h2>
            </Description>
            <Description>
              <Bullet />
              <h2>
                Move your code between browser, worker threads and Node.js and rely on your loaders
                to keep working.
              </h2>
            </Description>
          </TextContainer>
        </div>
      </Home>
    </Layout>
  );
}
