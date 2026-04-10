import React from 'react';
import {Home} from '../components';
import Layout from '@theme/Layout';
import HeroExample from '../examples/home-demo';
import Concepts from '../components/home/concepts';

export default function IndexPage() {
  return (
    <Layout title="Home" description="deck.gl">
      <Home HeroExample={HeroExample}>
        <Concepts />
      </Home>
    </Layout>
  );
}
