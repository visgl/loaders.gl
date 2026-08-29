import React from 'react';
import {ClientExample, Home} from '../components';
import Layout from '@theme/Layout';
import Features from '../components/home/features';

/** Renders the homepage example behind the shared client-only loading boundary. */
function HeroExample() {
  return <ClientExample kind="home" />;
}

export default function IndexPage() {
  return (
    <Layout title="Home" description="deck.gl">
      <Home HeroExample={HeroExample}>
        <Features showVisuals={false} />
      </Home>
    </Layout>
  );
}
